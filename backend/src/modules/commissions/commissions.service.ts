import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommissionDto, QueryCommissionsDto } from './dto/commissions.dto';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCommissionDto) {
    const professional = await this.prisma.professional.findFirst({
      where: { id: dto.professionalId, tenantId },
    });
    if (!professional) throw new NotFoundException('Profissional não encontrado');

    const commissionAmount = (dto.amount * dto.rate) / 100;

    return this.prisma.commission.create({
      data: {
        tenantId,
        professionalId: dto.professionalId,
        transactionId: dto.transactionId,
        appointmentId: dto.appointmentId,
        description: dto.description,
        amount: dto.amount,
        rate: dto.rate,
        commissionAmount,
        notes: dto.notes,
      },
      include: { professional: { select: { id: true, name: true } } },
    });
  }

  async findAll(tenantId: string, query: QueryCommissionsDto) {
    const where: any = { tenantId };

    if (query.professionalId) where.professionalId = query.professionalId;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    if (query.search) {
      where.description = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        include: {
          professional: { select: { id: true, name: true, color: true } },
          transaction: { select: { id: true, description: true, totalAmount: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where }),
    ]);

    const summary = await this.getSummary(tenantId, query);

    return { data, total, summary };
  }

  async getSummary(tenantId: string, query?: QueryCommissionsDto) {
    const where: any = { tenantId };
    if (query?.professionalId) where.professionalId = query.professionalId;

    const [pending, paid, cancelled] = await Promise.all([
      this.prisma.commission.aggregate({ where: { ...where, status: 'PENDING' }, _sum: { commissionAmount: true }, _count: true }),
      this.prisma.commission.aggregate({ where: { ...where, status: 'PAID' }, _sum: { commissionAmount: true }, _count: true }),
      this.prisma.commission.aggregate({ where: { ...where, status: 'CANCELLED' }, _sum: { commissionAmount: true }, _count: true }),
    ]);

    return {
      pendingAmount: pending._sum.commissionAmount || 0,
      pendingCount: pending._count,
      paidAmount: paid._sum.commissionAmount || 0,
      paidCount: paid._count,
      cancelledAmount: cancelled._sum.commissionAmount || 0,
      cancelledCount: cancelled._count,
    };
  }

  async findOne(tenantId: string, id: string) {
    const commission = await this.prisma.commission.findFirst({
      where: { id, tenantId },
      include: {
        professional: { select: { id: true, name: true, color: true } },
        transaction: { select: { id: true, description: true, totalAmount: true, paidAt: true } },
      },
    });
    if (!commission) throw new NotFoundException('Comissão não encontrada');
    return commission;
  }

  async pay(tenantId: string, id: string, userId: string, notes?: string) {
    const commission = await this.findOne(tenantId, id);
    if (commission.status === 'PAID') throw new Error('Comissão já está paga');
    if (commission.status === 'CANCELLED') throw new Error('Comissão cancelada não pode ser paga');

    return this.prisma.commission.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date(), paidByUserId: userId, notes: notes || undefined },
      include: { professional: { select: { id: true, name: true } } },
    });
  }

  async cancel(tenantId: string, id: string, reason?: string) {
    const commission = await this.findOne(tenantId, id);
    return this.prisma.commission.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? (commission.notes ? `${commission.notes}\nCancelamento: ${reason}` : `Cancelamento: ${reason}`) : commission.notes,
      },
      include: { professional: { select: { id: true, name: true } } },
    });
  }
}
