import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            professionals: true,
            appointments: true,
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Clínica não encontrada');
    return tenant;
  }

  async update(id: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Clínica não encontrada');

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async updateSettings(id: string, settings: Record<string, any>) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Clínica não encontrada');

    const currentSettings = (tenant.settings as Record<string, any>) || {};

    return this.prisma.tenant.update({
      where: { id },
      data: {
        settings: { ...currentSettings, ...settings },
      },
    });
  }

  async getSubscription(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true, subscription: true },
    });

    if (!tenant) throw new NotFoundException('Clínica não encontrada');

    return {
      ...tenant,
      subscription: tenant.subscription || {
        plan: 'free',
        maxUsers: 3,
        maxPatients: 100,
        features: ['basic'],
      },
    };
  }
}
