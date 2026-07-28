import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNfeConfigDto, UpdateNfeConfigDto } from './dto/create-nfe-config.dto';

@Injectable()
export class NfeConfigService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.nfeConfig.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const config = await this.prisma.nfeConfig.findFirst({
      where: { id, tenantId },
    });
    if (!config) throw new NotFoundException('Configuração NF-e não encontrada');
    return config;
  }

  async create(tenantId: string, dto: CreateNfeConfigDto) {
    const existing = await this.prisma.nfeConfig.findUnique({
      where: { tenantId_provider: { tenantId, provider: dto.provider as any } },
    });
    if (existing) throw new ConflictException(`Já existe configuração para ${dto.provider}`);

    return this.prisma.nfeConfig.create({
      data: {
        tenantId,
        provider: dto.provider as any,
        apiKey: dto.apiKey,
        apiUrl: dto.apiUrl,
        seriesNumber: dto.seriesNumber,
        environment: dto.environment || 'production',
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateNfeConfigDto) {
    await this.findOne(tenantId, id);
    return this.prisma.nfeConfig.update({
      where: { id },
      data: {
        ...(dto.apiKey !== undefined && { apiKey: dto.apiKey }),
        ...(dto.apiUrl !== undefined && { apiUrl: dto.apiUrl }),
        ...(dto.seriesNumber !== undefined && { seriesNumber: dto.seriesNumber }),
        ...(dto.environment !== undefined && { environment: dto.environment }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.nfeConfig.delete({ where: { id } });
    return { message: 'Configuração removida com sucesso' };
  }
}
