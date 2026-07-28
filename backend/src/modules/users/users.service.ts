import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    phone: true,
    avatarUrl: true,
    isActive: true,
    twoFactorEnabled: true,
    maxAppointmentsPerDay: true,
    lastLoginAt: true,
    createdAt: true,
  } as const;

  async findAll(tenantId: string, role?: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        ...(role && { role: role as any }),
      },
      select: this.userSelect,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });

    if (existing) {
      throw new ConflictException('Email já cadastrado nesta clínica');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role as any,
        phone: dto.phone,
        maxAppointmentsPerDay: dto.maxAppointmentsPerDay,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        maxAppointmentsPerDay: true,
        createdAt: true,
      },
    });
  }

  async toggleActive(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }
}
