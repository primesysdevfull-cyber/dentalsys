import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getAppointmentsReport(tenantId: string, startDate: string, endDate: string) {
    const where = {
      tenantId,
      startTime: { gte: new Date(startDate), lte: new Date(endDate) },
    };

    const [total, byStatus, byProfessional, byProcedure] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.appointment.groupBy({
        by: ['professionalId'],
        where,
        _count: true,
      }),
      this.prisma.appointment.groupBy({
        by: ['procedureId'],
        where: { ...where, procedureId: { not: null } },
        _count: true,
      }),
    ]);

    // Buscar nomes dos profissionais
    const professionalIds = byProfessional.map((p) => p.professionalId);
    const professionals = await this.prisma.professional.findMany({
      where: { id: { in: professionalIds } },
      select: { id: true, name: true },
    });

    const professionalMap = Object.fromEntries(professionals.map((p) => [p.id, p.name]));

    // Nomes dos procedimentos
    const procedureIds = byProcedure.map((p) => p.procedureId).filter(Boolean);
    const procedures = await this.prisma.procedure.findMany({
      where: { id: { in: procedureIds as string[] } },
      select: { id: true, name: true },
    });
    const procedureMap = Object.fromEntries(procedures.map((p) => [p.id, p.name]));

    return {
      period: { startDate, endDate },
      totalAppointments: total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byProfessional: byProfessional.map((p) => ({
        professionalId: p.professionalId,
        name: professionalMap[p.professionalId] || 'Desconhecido',
        count: p._count,
      })),
      byProcedure: byProcedure.map((p) => ({
        procedureId: p.procedureId,
        name: procedureMap[p.procedureId!] || 'Não informado',
        count: p._count,
      })),
    };
  }

  async getRevenueReport(tenantId: string, startDate: string, endDate: string) {
    const where = {
      tenantId,
      type: 'INCOME' as const,
      createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
    };

    const [totalRevenue, paidRevenue, pendingRevenue, byPaymentMethod, monthlyRevenue] =
      await Promise.all([
        this.prisma.financialTransaction.aggregate({
          where: { ...where, status: { not: 'CANCELLED' } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        this.prisma.financialTransaction.aggregate({
          where: { ...where, status: 'PAID' },
          _sum: { totalAmount: true },
        }),
        this.prisma.financialTransaction.aggregate({
          where: {
            tenantId,
            type: 'INCOME',
            status: { in: ['PENDING', 'OVERDUE'] },
            createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.financialTransaction.groupBy({
          by: ['paymentMethod'],
          where: { ...where, status: 'PAID' },
          _sum: { totalAmount: true },
          _count: true,
        }),
        // Receita por mês
        this.prisma.$queryRaw`
          SELECT
            TO_CHAR(created_at, 'YYYY-MM') as month,
            SUM(total_amount)::float as revenue,
            COUNT(*)::int as count
          FROM financial_transactions
          WHERE tenant_id = ${tenantId}
            AND type = 'INCOME'
            AND status = 'PAID'
            AND created_at >= ${new Date(startDate)}
            AND created_at <= ${new Date(endDate)}
          GROUP BY TO_CHAR(created_at, 'YYYY-MM')
          ORDER BY month
        `,
      ]);

    return {
      period: { startDate, endDate },
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      totalTransactions: totalRevenue._count,
      paidRevenue: Number(paidRevenue._sum.totalAmount || 0),
      pendingRevenue: Number(pendingRevenue._sum.totalAmount || 0),
      collectionRate:
        Number(totalRevenue._sum.totalAmount || 0) > 0
          ? (Number(paidRevenue._sum.totalAmount || 0) / Number(totalRevenue._sum.totalAmount || 0)) * 100
          : 0,
      byPaymentMethod: byPaymentMethod.map((m) => ({
        method: m.paymentMethod || 'Não informado',
        total: Number(m._sum.totalAmount || 0),
        count: m._count,
      })),
      monthlyRevenue,
    };
  }

  async getOccupancyReport(tenantId: string, startDate: string, endDate: string) {
    const totalSlots = await this.prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: new Date(startDate), lte: new Date(endDate) },
        status: { notIn: ['CANCELLED'] },
      },
    });

    const completedSlots = await this.prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: new Date(startDate), lte: new Date(endDate) },
        status: 'COMPLETED',
      },
    });

    const noShows = await this.prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: new Date(startDate), lte: new Date(endDate) },
        status: 'NO_SHOW',
      },
    });

    const cancellations = await this.prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: new Date(startDate), lte: new Date(endDate) },
        status: 'CANCELLED',
      },
    });

    return {
      period: { startDate, endDate },
      totalScheduled: totalSlots,
      completed: completedSlots,
      noShows,
      cancellations,
      occupancyRate: totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0,
      noShowRate: totalSlots > 0 ? (noShows / totalSlots) * 100 : 0,
    };
  }

  async getProfessionalPerformance(tenantId: string, startDate: string, endDate: string) {
    const professionals = await this.prisma.professional.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, specialty: true },
    });

    const performance = await Promise.all(
      professionals.map(async (prof) => {
        const [appointments, revenue] = await Promise.all([
          this.prisma.appointment.count({
            where: {
              tenantId,
              professionalId: prof.id,
              startTime: { gte: new Date(startDate), lte: new Date(endDate) },
              status: 'COMPLETED',
            },
          }),
          this.prisma.financialTransaction.aggregate({
            where: {
              tenantId,
              professionalId: prof.id,
              type: 'INCOME',
              status: 'PAID',
              createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
            },
            _sum: { totalAmount: true },
          }),
        ]);

        return {
          professionalId: prof.id,
          name: prof.name,
          specialty: prof.specialty,
          completedAppointments: appointments,
          revenue: Number(revenue._sum.totalAmount || 0),
        };
      }),
    );

    return {
      period: { startDate, endDate },
      professionals: performance.sort((a, b) => b.revenue - a.revenue),
    };
  }

  async getMostProceduresReport(tenantId: string, startDate: string, endDate: string) {
    const result = await this.prisma.clinicalRecord.groupBy({
      by: ['procedureId'],
      where: {
        tenantId,
        procedureId: { not: null },
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      _count: true,
      orderBy: { _count: { procedureId: 'desc' } },
      take: 10,
    });

    const procedureIds = result.map((r) => r.procedureId).filter(Boolean);
    const procedures = await this.prisma.procedure.findMany({
      where: { id: { in: procedureIds as string[] } },
      select: { id: true, name: true, code: true, defaultPrice: true },
    });

    const procedureMap = Object.fromEntries(procedures.map((p) => [p.id, p]));

    return result.map((r) => ({
      procedure: procedureMap[r.procedureId!] || { name: 'Não informado' },
      count: r._count,
    }));
  }

  async getDelinquencyReport(tenantId: string) {
    const overdue = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        type: 'INCOME',
        status: 'OVERDUE',
      },
      include: {
        patient: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalOverdue = overdue.reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const overdueByAge = {
      'upTo30Days': 0,
      'days31to60': 0,
      'days61to90': 0,
      'over90Days': 0,
    };

    const now = new Date();
    overdue.forEach((t) => {
      const daysDiff = Math.floor((now.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(t.totalAmount);
      if (daysDiff <= 30) overdueByAge.upTo30Days += amount;
      else if (daysDiff <= 60) overdueByAge.days31to60 += amount;
      else if (daysDiff <= 90) overdueByAge.days61to90 += amount;
      else overdueByAge.over90Days += amount;
    });

    return {
      totalOverdueAmount: totalOverdue,
      totalOverdueCount: overdue.length,
      overdueByAge,
      transactions: overdue,
    };
  }

  async getProductivityReport(tenantId: string, startDate: string, endDate: string) {
    const professionals = await this.prisma.professional.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, specialty: true },
    });

    const dailyMap: Record<string, Record<string, { scheduled: number; completed: number; noShow: number; cancelled: number }>> = {};

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      select: {
        id: true,
        professionalId: true,
        status: true,
        startTime: true,
      },
    });

    appointments.forEach((a) => {
      const day = new Date(a.startTime).toISOString().split('T')[0];
      const profId = a.professionalId;
      if (!dailyMap[day]) dailyMap[day] = {};
      if (!dailyMap[day][profId]) dailyMap[day][profId] = { scheduled: 0, completed: 0, noShow: 0, cancelled: 0 };
      dailyMap[day][profId].scheduled++;
      if (a.status === 'COMPLETED') dailyMap[day][profId].completed++;
      if (a.status === 'NO_SHOW') dailyMap[day][profId].noShow++;
      if (a.status === 'CANCELLED') dailyMap[day][profId].cancelled++;
    });

    const professionalsMap = Object.fromEntries(professionals.map((p) => [p.id, p]));

    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, profs]) => ({
        date,
        professionals: Object.entries(profs).map(([profId, data]) => ({
          professionalId: profId,
          name: professionalsMap[profId]?.name || 'Desconhecido',
          specialty: professionalsMap[profId]?.specialty || '',
          ...data,
        })),
      }));

    // Totais por profissional no período
    const totals = professionals.map((p) => {
      const profApps = appointments.filter((a) => a.professionalId === p.id);
      return {
        professionalId: p.id,
        name: p.name,
        specialty: p.specialty,
        scheduled: profApps.length,
        completed: profApps.filter((a) => a.status === 'COMPLETED').length,
        noShow: profApps.filter((a) => a.status === 'NO_SHOW').length,
        cancelled: profApps.filter((a) => a.status === 'CANCELLED').length,
        attendanceRate: profApps.length > 0
          ? Math.round((profApps.filter((a) => a.status === 'COMPLETED').length / profApps.length) * 100)
          : 0,
      };
    });

    return {
      period: { startDate, endDate },
      daily,
      totals: totals.sort((a, b) => b.scheduled - a.scheduled),
    };
  }
}
