import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CashFlowQueryDto, DailySummaryDto } from './dto/cash-flow.dto';
import { endOfDay, startOfDay, parseISO } from 'date-fns';

@Injectable()
export class CashFlowService {
  constructor(private prisma: PrismaService) {}

  async getPeriodSummary(tenantId: string, query: CashFlowQueryDto) {
    const endDate = query.endDate ? endOfDay(parseISO(query.endDate)) : endOfDay(new Date());
    const startDate = query.startDate ? startOfDay(parseISO(query.startDate)) : startOfDay(new Date(new Date().setDate(new Date().getDate() - 30)));

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['PAID', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const pendingIncome = transactions
      .filter(t => t.type === 'INCOME' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const pendingExpense = transactions
      .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    return {
      period: { startDate, endDate },
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense,
      pendingBalance: pendingIncome - pendingExpense,
      transactionCount: transactions.length,
      transactions,
    };
  }

  async getDailySummary(tenantId: string, query: CashFlowQueryDto): Promise<DailySummaryDto[]> {
    const endDate = query.endDate ? endOfDay(parseISO(query.endDate)) : endOfDay(new Date());
    const startDate = query.startDate ? startOfDay(parseISO(query.startDate)) : startOfDay(new Date(new Date().setDate(new Date().getDate() - 30)));

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
    });

    const closures = await this.prisma.dailyClosure.findMany({
      where: { tenantId, closureDate: { gte: startDate, lte: endDate } },
    });

    const closedDates = new Set(closures.map(c => c.closureDate.toISOString().split('T')[0]));
    const dailyMap = new Map<string, { income: number; expense: number; count: number }>();

    for (const t of transactions) {
      const day = t.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(day) || { income: 0, expense: 0, count: 0 };
      if (t.type === 'INCOME') entry.income += Number(t.totalAmount);
      else entry.expense += Number(t.totalAmount);
      entry.count++;
      dailyMap.set(day, entry);
    }

    const result: DailySummaryDto[] = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().split('T')[0];
      const dayData = dailyMap.get(key) || { income: 0, expense: 0, count: 0 };
      result.push({
        date: key,
        income: dayData.income,
        expense: dayData.expense,
        balance: dayData.income - dayData.expense,
        transactions: dayData.count,
        closed: closedDates.has(key),
      });
      current = new Date(current.setDate(current.getDate() + 1));
    }

    return result;
  }

  async closeDay(tenantId: string, closureDate: string, closedById: string, notes?: string) {
    const parsedDate = startOfDay(parseISO(closureDate));
    const endDate = endOfDay(parseISO(closureDate));

    const existing = await this.prisma.dailyClosure.findUnique({
      where: { tenantId_closureDate: { tenantId, closureDate: parsedDate } },
    });
    if (existing) throw new BadRequestException('Dia já foi fechado');

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        createdAt: { gte: parsedDate, lte: endDate },
        status: 'PAID',
      },
    });

    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.totalAmount), 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.totalAmount), 0);
    const balance = totalIncome - totalExpense;

    return this.prisma.dailyClosure.create({
      data: {
        tenantId,
        closureDate: parsedDate,
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length,
        closedById,
        notes,
      },
    });
  }

  async getClosures(tenantId: string, query: CashFlowQueryDto) {
    const endDate = query.endDate ? endOfDay(parseISO(query.endDate)) : endOfDay(new Date());
    const startDate = query.startDate ? startOfDay(parseISO(query.startDate)) : startOfDay(new Date(new Date().setMonth(new Date().getMonth() - 3)));

    return this.prisma.dailyClosure.findMany({
      where: { tenantId, closureDate: { gte: startDate, lte: endDate } },
      orderBy: { closureDate: 'desc' },
    });
  }
}
