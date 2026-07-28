import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProfessionalDto) {
    const { email, phone, address, maxAppointmentsPerDay, userId: directUserId, ...proData } = dto;
    let finalUserId = directUserId;

    if (email && !finalUserId) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email, tenantId },
      });
      if (existingUser) {
        finalUserId = existingUser.id;
      }
    }

    return this.prisma.professional.create({
      data: {
        tenantId,
        name: proData.name,
        croNumber: proData.croNumber,
        specialty: proData.specialty,
        color: proData.color,
        commissionRate: proData.commissionRate ?? 0,
        workingHours: proData.workingHours ?? {},
        isActive: proData.isActive ?? true,
        userId: finalUserId,
      },
    });
  }

  async findAll(tenantId: string, query?: { search?: string; isActive?: string }) {
    const where: any = { tenantId };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { croNumber: { contains: query.search, mode: 'insensitive' } },
        { specialty: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const total = await this.prisma.professional.count({ where });

    const data = await this.prisma.professional.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        user: { select: { id: true, email: true, role: true, maxAppointmentsPerDay: true } },
        _count: { select: { appointments: true } },
      },
    });

    return { data, meta: { total, page: 1, limit: total, totalPages: 1 } };
  }

  async findOne(id: string, tenantId: string) {
    const professional = await this.prisma.professional.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, email: true, role: true } },
        _count: { select: { appointments: true, roomAssignments: true } },
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 5,
          include: {
            patient: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }
    return professional;
  }

  async update(id: string, tenantId: string, dto: UpdateProfessionalDto) {
    await this.findOne(id, tenantId);
    return this.prisma.professional.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.croNumber !== undefined && { croNumber: dto.croNumber }),
        ...(dto.specialty !== undefined && { specialty: dto.specialty }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.commissionRate !== undefined && { commissionRate: dto.commissionRate }),
        ...(dto.workingHours !== undefined && { workingHours: dto.workingHours }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.userId !== undefined && { userId: dto.userId }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    const appointmentCount = await this.prisma.appointment.count({
      where: { professionalId: id },
    });
    if (appointmentCount > 0) {
      throw new NotFoundException(
        `Não é possível excluir: profissional vinculado a ${appointmentCount} agendamento(s).`,
      );
    }

    await this.prisma.professional.delete({ where: { id } });
    return { message: 'Profissional removido com sucesso' };
  }

  async getCommissionSummary(tenantId: string, query?: { startDate?: string; endDate?: string }) {
    const professionals = await this.prisma.professional.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
        commissionRate: true,
        _count: { select: { appointments: true } },
      },
    });

    const dateFilter: any = {};
    if (query?.startDate) dateFilter.gte = new Date(query.startDate);
    if (query?.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const hasDateFilter = query?.startDate || query?.endDate;

    const result = await Promise.all(
      professionals.map(async (p) => {
        const appointmentWhere: any = {
          professionalId: p.id,
          status: 'COMPLETED',
        };
        if (hasDateFilter) appointmentWhere.startTime = dateFilter;

        const completedAppointments = await this.prisma.appointment.count({
          where: appointmentWhere,
        });

        const transactionWhere: any = {
          type: 'INCOME',
          status: 'PAID',
          professionalId: p.id,
        };
        if (hasDateFilter) transactionWhere.createdAt = dateFilter;

        const completedTransactions = await this.prisma.financialTransaction.findMany({
          where: transactionWhere,
          select: { totalAmount: true, createdAt: true },
        });

        const totalRevenue = completedTransactions.reduce(
          (sum, t) => sum + Number(t.totalAmount),
          0,
        );
        const commission = totalRevenue * Number(p.commissionRate) / 100;

        // Daily breakdown
        const dailyMap: Record<string, { revenue: number; commission: number; transactions: number }> = {};
        completedTransactions.forEach((t) => {
          const day = new Date(t.createdAt).toISOString().split('T')[0];
          if (!dailyMap[day]) dailyMap[day] = { revenue: 0, commission: 0, transactions: 0 };
          dailyMap[day].revenue += Number(t.totalAmount);
          dailyMap[day].commission += Number(t.totalAmount) * Number(p.commissionRate) / 100;
          dailyMap[day].transactions += 1;
        });

        // Monthly breakdown
        const monthlyMap: Record<string, { revenue: number; commission: number; transactions: number }> = {};
        completedTransactions.forEach((t) => {
          const month = new Date(t.createdAt).toISOString().slice(0, 7); // YYYY-MM
          if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, commission: 0, transactions: 0 };
          monthlyMap[month].revenue += Number(t.totalAmount);
          monthlyMap[month].commission += Number(t.totalAmount) * Number(p.commissionRate) / 100;
          monthlyMap[month].transactions += 1;
        });

        const daily = Object.entries(dailyMap)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, data]) => ({ date, ...data }));

        const monthly = Object.entries(monthlyMap)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([month, data]) => ({ month, ...data }));

        return {
          id: p.id,
          name: p.name,
          specialty: p.specialty,
          commissionRate: Number(p.commissionRate),
          totalAppointments: p._count.appointments,
          completedAppointments,
          totalRevenue,
          commission,
          daily,
          monthly,
        };
      }),
    );

    return result;
  }
}
