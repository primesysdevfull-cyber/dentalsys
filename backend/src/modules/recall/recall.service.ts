import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecallCampaignDto } from './dto/recall.dto';
import { addMonths, startOfDay, parseISO } from 'date-fns';

@Injectable()
export class RecallService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRecallCampaignDto) {
    return this.prisma.recallCampaign.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type as any,
        config: dto.config || {},
        message: dto.message,
        channel: dto.channel || 'WHATSAPP',
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.recallCampaign.findMany({
      where: { tenantId },
      include: { _count: { select: { logs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const campaign = await this.prisma.recallCampaign.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { logs: true } },
        logs: {
          take: 50,
          orderBy: { sentAt: 'desc' },
          include: { patient: { select: { id: true, name: true, whatsapp: true } } },
        },
      },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findOne(tenantId, id);
    return this.prisma.recallCampaign.update({ where: { id }, data: dto });
  }

  async toggleStatus(tenantId: string, id: string) {
    const campaign = await this.findOne(tenantId, id);
    return this.prisma.recallCampaign.update({
      where: { id },
      data: { status: campaign.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.recallCampaign.delete({ where: { id } });
  }

  async execute(tenantId: string, id: string) {
    const campaign = await this.findOne(tenantId, id);
    const config = campaign.config as Record<string, any>;
    let patients: Array<{ id: string; name: string; whatsapp: string | null; phone: string | null; email: string | null }> = [];

    if (campaign.type === 'ABSENT') {
      const months = config.monthsAbsent || 3;
      const cutoff = addMonths(new Date(), -months);
      const appointments = await this.prisma.appointment.findMany({
        where: { tenantId, startTime: { lt: cutoff } },
        include: { patient: { select: { id: true, name: true, whatsapp: true, phone: true, email: true } } },
        orderBy: { startTime: 'desc' },
        distinct: ['patientId'],
      });
      patients = appointments.map(a => a.patient);
    } else if (campaign.type === 'BIRTHDAY') {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const allPatients = await this.prisma.patient.findMany({
        where: { tenantId },
        select: { id: true, name: true, whatsapp: true, phone: true, email: true, birthDate: true },
      });
      patients = allPatients.filter(p => {
        if (!p.birthDate) return false;
        const bd = new Date(p.birthDate);
        return bd.getMonth() + 1 === month && bd.getDate() === day;
      });
    } else if (campaign.type === 'INCOMPLETE_TREATMENT') {
      const plans = await this.prisma.treatmentPlan.findMany({
        where: {
          tenantId,
          status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
          items: { some: { status: { not: 'COMPLETED' } } },
        },
        include: { patient: { select: { id: true, name: true, whatsapp: true, phone: true, email: true } } },
      });
      patients = plans.map(p => p.patient).filter((p, i, arr) => arr.findIndex(a => a.id === p.id) === i);
    }

    let sent = 0, failed = 0, skipped = 0;
    for (const patient of patients) {
      if (!patient.whatsapp && !patient.phone && !patient.email) { skipped++; continue; }
      try {
        const channel = patient.whatsapp ? 'WHATSAPP' : patient.phone ? 'SMS' : 'EMAIL';
        const personalizedMsg = campaign.message
          .replace('{{nome}}', patient.name)
          .replace('{{paciente}}', patient.name);

        await this.prisma.recallLog.create({
          data: {
            campaignId: id,
            patientId: patient.id,
            status: 'SENT',
            channel,
          },
        });
        sent++;
      } catch {
        await this.prisma.recallLog.create({
          data: {
            campaignId: id,
            patientId: patient.id,
            status: 'FAILED',
            channel: 'WHATSAPP',
            error: 'Erro ao enviar',
          },
        });
        failed++;
      }
    }

    await this.prisma.recallCampaign.update({
      where: { id },
      data: { lastRunAt: new Date() },
    });

    return { sent, failed, skipped, total: patients.length, campaign: campaign.name };
  }

  async getLogs(tenantId: string, campaignId: string) {
    return this.prisma.recallLog.findMany({
      where: { campaignId, campaign: { tenantId } },
      include: { patient: { select: { id: true, name: true, whatsapp: true } } },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  }
}
