import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInsuranceDto, UpdateInsuranceDto } from './dto/create-insurance.dto';

@Injectable()
export class InsurancesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.insurance.findMany({
      where: { tenantId },
      include: { _count: { select: { patients: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const insurance = await this.prisma.insurance.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { patients: true } } },
    });
    if (!insurance) throw new NotFoundException('Convênio não encontrado');
    return insurance;
  }

  async create(tenantId: string, dto: CreateInsuranceDto) {
    return this.prisma.insurance.create({
      data: { tenantId, ...dto, coverageRules: dto.coverageRules || [] },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateInsuranceDto) {
    await this.findOne(tenantId, id);
    return this.prisma.insurance.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.coverageRules && { coverageRules: dto.coverageRules }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    const patientCount = await this.prisma.patient.count({ where: { insuranceId: id } });
    if (patientCount > 0) {
      await this.prisma.patient.updateMany({ where: { insuranceId: id }, data: { insuranceId: null } });
    }
    await this.prisma.insurance.delete({ where: { id } });
    return { message: 'Convênio removido com sucesso' };
  }
}
