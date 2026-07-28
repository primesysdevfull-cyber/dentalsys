import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenant: { isActive: true },
      },
      include: { tenant: { select: { id: true, name: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, tenantId: user.tenantId, requires2fa: true },
        { expiresIn: '5m' },
      );
      return {
        requires2fa: true,
        tempToken,
        message: 'Autenticação em dois fatores necessária',
      };
    }

    return this.generateTokens(user, ipAddress, userAgent);
  }

  async loginWith2fa(dto: Verify2faDto, tempToken: string) {
    try {
      const payload = this.jwtService.verify(tempToken);

      if (!payload.requires2fa) {
        throw new BadRequestException('Token inválido');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.twoFactorSecret) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: dto.code,
        window: 1,
      });

      if (!verified) {
        throw new UnauthorizedException('Código 2FA inválido');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const [tenant, user] = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          name: dto.clinicName,
          cnpj: dto.cnpj,
          email: dto.email,
          phone: dto.phone,
        },
      });

      const u = await tx.user.create({
        data: {
          tenantId: t.id,
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      return [t, u];
    });

    return this.generateTokens(user);
  }

  async enable2fa(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('TOTP_ISSUER')} (${userId})`,
      issuer: this.configService.get('TOTP_ISSUER'),
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  async confirm2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.twoFactorSecret) {
      throw new BadRequestException('2FA não configurado');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedException('Código inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA ativado com sucesso' };
  }

  async disable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.twoFactorSecret) {
      throw new BadRequestException('2FA não está ativado');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedException('Código inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: '2FA desativado com sucesso' };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive || user.refreshToken !== token) {
        throw new UnauthorizedException('Token de refresh inválido');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        phone: true,
        twoFactorEnabled: true,
        tenant: {
          select: {
            id: true,
            name: true,
            tradeName: true,
            logoUrl: true,
          },
        },
        createdAt: true,
      },
    });
    return user;
  }

  private async generateTokens(user: any, ipAddress?: string, userAgent?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
