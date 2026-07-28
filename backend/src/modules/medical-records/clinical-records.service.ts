import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateOdontogramDto } from './dto/update-odontogram.dto';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { AddTreatmentPlanItemDto } from './dto/add-treatment-plan-item.dto';

@Injectable()
export class ClinicalRecordsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Serviço unificado que gerencia 3 domínios do paciente:
   *
   * 1. PRONTUÁRIO (ClinicalRecord)
   *    - anamnese:   diagnosis + observations
   *    - evolução:   treatmentDone + prescriptions
   *    - procedimento: procedureId vinculado
   *
   * 2. ODONTOGRAMA (Odontogram + OdontogramTooth)
   *    - Mapa dental com condições por dente
   *    - Cada dente pode ter múltiplas condições
   *
   * 3. PLANO DE TRATAMENTO (TreatmentPlan + TreatmentPlanItem)
   *    - Proposta de tratamento com itens e estimativa
   *    - Aceitar plano → gera transação financeira automaticamente
   */

  async findByPatient(tenantId: string, patientId: string) {
    const records = await this.prisma.clinicalRecord.findMany({
      where: { tenantId, patientId },
      include: {
        appointment: { select: { id: true, startTime: true } },
        procedure: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records;
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.prisma.clinicalRecord.findFirst({
      where: { id, tenantId },
      include: {
        appointment: true,
        patient: true,
        procedure: true,
      },
    });
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    return record;
  }

  async create(tenantId: string, dto: CreateClinicalRecordDto) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.clinicalRecord.create({
        data: {
          tenantId,
          appointmentId: dto.appointmentId,
          patientId: dto.patientId,
          procedureId: dto.procedureId,
          diagnosis: dto.diagnosis,
          treatmentDone: dto.treatmentDone,
          prescriptions: dto.prescriptions,
          observations: dto.observations,
          nextAppointment: dto.nextAppointment,
        },
        include: {
          procedure: { select: { id: true, name: true } },
        },
      });

      if (dto.appointmentId) {
        await tx.appointment.update({
          where: { id: dto.appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      return record;
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateClinicalRecordDto>) {
    const record = await this.prisma.clinicalRecord.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException('Prontuário não encontrado');

    return this.prisma.clinicalRecord.update({
      where: { id },
      data: dto,
    });
  }

  // ===================== ODONTOGRAMA =====================

  async getOdontogram(tenantId: string, patientId: string) {
    let odontogram = await this.prisma.odontogram.findUnique({
      where: { patientId },
      include: { teeth: true },
    });

    if (!odontogram) {
      odontogram = await this.prisma.odontogram.create({
        data: { patientId },
        include: { teeth: true },
      });
    }

    return odontogram;
  }

  async updateOdontogram(tenantId: string, patientId: string, dto: UpdateOdontogramDto) {
    // Garantir que o odontograma exista
    await this.prisma.odontogram.upsert({
      where: { patientId },
      create: { patientId },
      update: {},
    });

    // Remover condições existentes e recriar
    if (dto.teeth && dto.teeth.length > 0) {
      const odontogram = await this.prisma.odontogram.findUnique({
      where: { patientId },
      });

      await this.prisma.odontogramTooth.deleteMany({
        where: { odontogram: { patientId } },
      });

      await this.prisma.odontogramTooth.createMany({
        data: dto.teeth.map((tooth) => ({
          odontogramId: odontogram!.id,
          toothNumber: tooth.toothNumber,
          condition: tooth.condition as any,
          notes: tooth.notes,
          surface: tooth.surface,
        })),
      });
    }

    return this.getOdontogram(tenantId, patientId);
  }

  async updateSingleTooth(tenantId: string, patientId: string, toothNumber: number, condition: string, notes?: string, surface?: string) {
    await this.prisma.odontogram.upsert({
      where: { patientId },
      create: { patientId },
      update: {},
    });

    // Adicionar nova condição ao dente
    const odontogram = await this.prisma.odontogram.findUnique({
      where: { patientId },
    });

    return this.prisma.odontogramTooth.create({
      data: {
        odontogramId: odontogram!.id,
        toothNumber,
        condition: condition as any,
        notes,
        surface,
      },
    });
  }

  async removeToothCondition(tenantId: string, toothConditionId: string) {
    await this.prisma.odontogramTooth.delete({
      where: { id: toothConditionId },
    });
    return { message: 'Condição removida com sucesso' };
  }

  // ===================== PLANOS DE TRATAMENTO =====================

  async findTreatmentPlans(tenantId: string, patientId: string) {
    return this.prisma.treatmentPlan.findMany({
      where: { patientId, tenantId },
      include: {
        items: {
          include: { procedure: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTreatmentPlan(tenantId: string, id: string) {
    const plan = await this.prisma.treatmentPlan.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: { procedure: true },
          orderBy: { order: 'asc' },
        },
        patient: { select: { id: true, name: true } },
      },
    });
    if (!plan) throw new NotFoundException('Plano de tratamento não encontrado');
    return plan;
  }

  async createTreatmentPlan(tenantId: string, dto: CreateTreatmentPlanDto) {
    return this.prisma.treatmentPlan.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        title: dto.title,
        description: dto.description,
        totalEstimate: dto.totalEstimate,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        estimatedEndDate: dto.estimatedEndDate ? new Date(dto.estimatedEndDate) : undefined,
        items: dto.items
          ? {
              create: dto.items.map((item, index) => ({
                procedureId: item.procedureId,
                toothNumber: item.toothNumber,
                description: item.description,
                estimatedPrice: item.estimatedPrice,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        items: { include: { procedure: true } },
      },
    });
  }

  async updateTreatmentPlan(tenantId: string, id: string, dto: Partial<CreateTreatmentPlanDto>) {
    const plan = await this.prisma.treatmentPlan.findFirst({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');

    return this.prisma.treatmentPlan.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status as any,
        totalEstimate: dto.totalEstimate,
      },
      include: {
        items: { include: { procedure: true } },
      },
    });
  }

  async addItemToTreatmentPlan(tenantId: string, planId: string, dto: AddTreatmentPlanItemDto) {
    const plan = await this.prisma.treatmentPlan.findFirst({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plano não encontrado');

    const maxOrder = await this.prisma.treatmentPlanItem.findFirst({
      where: { treatmentPlanId: planId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.treatmentPlanItem.create({
      data: {
        treatmentPlanId: planId,
        procedureId: dto.procedureId,
        toothNumber: dto.toothNumber,
        description: dto.description,
        estimatedPrice: dto.estimatedPrice,
        order: (maxOrder?.order || 0) + 1,
      },
      include: { procedure: true },
    });
  }

  async removeItemFromTreatmentPlan(tenantId: string, planId: string, itemId: string) {
    await this.prisma.treatmentPlanItem.deleteMany({
      where: { id: itemId, treatmentPlanId: planId },
    });
    return { message: 'Item removido com sucesso' };
  }

  async startTreatmentPlan(tenantId: string, planId: string) {
    const plan = await this.prisma.treatmentPlan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) throw new NotFoundException('Plano de tratamento não encontrado');

    return this.prisma.treatmentPlan.update({
      where: { id: planId },
      data: { status: 'IN_PROGRESS' },
      include: { items: { include: { procedure: true } } },
    });
  }

  async cancelTreatmentPlan(tenantId: string, planId: string) {
    const plan = await this.prisma.treatmentPlan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) throw new NotFoundException('Plano de tratamento não encontrado');

    return this.prisma.treatmentPlan.update({
      where: { id: planId },
      data: { status: 'CANCELLED' },
      include: { items: { include: { procedure: true } } },
    });
  }

  async completeTreatmentPlan(tenantId: string, planId: string) {
    const plan = await this.prisma.treatmentPlan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) throw new NotFoundException('Plano de tratamento não encontrado');

    return this.prisma.treatmentPlan.update({
      where: { id: planId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: {
        items: { include: { procedure: true } },
      },
    });
  }

  async acceptTreatmentPlan(tenantId: string, planId: string) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.update({
        where: { id: planId },
        data: { status: 'ACCEPTED' },
        include: { patient: { select: { id: true, name: true } } },
      });

      if (plan.totalEstimate && Number(plan.totalEstimate) > 0) {
        await tx.financialTransaction.create({
          data: {
            tenantId,
            patientId: plan.patientId,
            type: 'INCOME',
            description: `Plano: ${plan.title}`,
            amount: plan.totalEstimate,
            totalAmount: plan.totalEstimate,
            status: 'PENDING',
            category: 'TRATAMENTO',
          },
        });
      }

      return plan;
    });
  }
}
