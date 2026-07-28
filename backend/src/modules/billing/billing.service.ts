import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Prisma, TransactionStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: {
    type?: string;
    status?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, status, patientId, startDate, endDate, page: rawPage, limit: rawLimit } = query;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FinancialTransactionWhereInput = {
      tenantId,
      ...(type && { type: type as any }),
      ...(status && { status: status as any }),
      ...(patientId && { patientId }),
      ...(startDate && endDate && {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.financialTransaction.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true } },
          professional: { select: { id: true, name: true } },
          procedure: { select: { id: true, name: true } },
          installments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        procedure: true,
        installments: true,
      },
    });
    if (!transaction) throw new NotFoundException('Transação não encontrada');
    return transaction;
  }

  async create(tenantId: string, dto: CreateTransactionDto) {
    const amount = new Prisma.Decimal(dto.amount);
    const discount = new Prisma.Decimal(dto.discount || 0);
    const totalAmount = amount.minus(discount);

    const transaction = await this.prisma.financialTransaction.create({
      data: {
        tenantId,
        type: dto.type as any,
        patientId: dto.patientId,
        procedureId: dto.procedureId,
        professionalId: dto.professionalId,
        description: dto.description,
        amount,
        discount,
        totalAmount,
        paymentMethod: dto.paymentMethod as any,
        status: ['CREDIT_CARD', 'PIX', 'CASH', 'DEBIT_CARD'].includes(dto.paymentMethod as string) ? 'PAID' : 'PENDING',
        paidAt: ['CREDIT_CARD', 'PIX', 'CASH', 'DEBIT_CARD'].includes(dto.paymentMethod as string) ? new Date() : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        category: dto.category,
        notes: dto.notes,
      },
      include: { patient: true, procedure: true },
    });

    // Criar parcelas se houver
    if (dto.totalInstallments && dto.totalInstallments > 1) {
      const installmentAmount = totalAmount.div(dto.totalInstallments);
      const installments = [];

      for (let i = 1; i <= dto.totalInstallments; i++) {
        const dueDate = new Date(dto.dueDate || new Date());
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        installments.push({
          transactionId: transaction.id,
          number: i,
          amount: installmentAmount,
          dueDate,
          status: i === 1 ? 'PAID' as TransactionStatus : 'PENDING' as TransactionStatus,
          paidAt: i === 1 && dto.paymentMethod === 'CREDIT_CARD' ? new Date() : undefined,
        });
      }

      await this.prisma.installment.createMany({ data: installments });
    }

    return this.findOne(tenantId, transaction.id);
  }

  async update(tenantId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.financialTransaction.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Transação não encontrada');

    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as any }),
        ...(dto.type && { type: dto.type as any }),
        ...(dto.patientId && { patientId: dto.patientId }),
        ...(dto.procedureId && { procedureId: dto.procedureId }),
        ...(dto.professionalId && { professionalId: dto.professionalId }),
        ...(dto.description && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.discount !== undefined && { discount: new Prisma.Decimal(dto.discount) }),
        ...(dto.paymentMethod && { paymentMethod: dto.paymentMethod as any }),
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.category && { category: dto.category }),
        ...(dto.notes && { notes: dto.notes }),
      },
    });
  }

  async markAsPaid(tenantId: string, id: string, paymentMethod?: string, professionalId?: string) {
    const existing = await this.prisma.financialTransaction.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Transação não encontrada');

    if (existing.status === 'PAID') {
      throw new BadRequestException('Transação já foi paga');
    }

    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        status: 'PAID',
        ...(paymentMethod && { paymentMethod: paymentMethod as any }),
        professionalId: professionalId || existing.professionalId,
        paidAt: new Date(),
      },
    });
  }

  async payInstallment(tenantId: string, transactionId: string, installmentId: string) {
    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id: transactionId, tenantId },
      include: { installments: true },
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada');

    const installment = transaction.installments.find((i) => i.id === installmentId);
    if (!installment) throw new NotFoundException('Parcela não encontrada');

    await this.prisma.installment.update({
      where: { id: installmentId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // Verificar se todas as parcelas foram pagas
    const allInstallments = await this.prisma.installment.findMany({
      where: { transactionId },
    });

    const allPaid = allInstallments.every(
      (i) => i.id === installmentId ? true : i.status === 'PAID',
    );

    if (allPaid) {
      await this.prisma.financialTransaction.update({
        where: { id: transactionId },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    return { message: 'Parcela paga com sucesso' };
  }

  async getAccountsReceivable(tenantId: string) {
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        type: 'INCOME',
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      include: {
        patient: { select: { id: true, name: true } },
        installments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const total = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);

    return { transactions, total };
  }

  async getAccountsPayable(tenantId: string) {
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        type: 'EXPENSE',
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      include: { installments: true },
      orderBy: { dueDate: 'asc' },
    });

    const total = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);

    return { transactions, total };
  }

  async getDashboard(tenantId: string, startDate?: string, endDate?: string) {
    const dateFilter = startDate && endDate ? {
      createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
    } : {
      createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    };

    const [income, expenses, pending, overdue, professionals] = await Promise.all([
      this.prisma.financialTransaction.aggregate({
        where: { tenantId, type: 'INCOME', status: 'PAID', ...dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.financialTransaction.aggregate({
        where: { tenantId, type: 'EXPENSE', status: 'PAID', ...dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.financialTransaction.aggregate({
        where: { tenantId, status: 'PENDING', ...dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.financialTransaction.aggregate({
        where: { tenantId, status: 'OVERDUE' },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.professional.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, commissionRate: true },
      }),
    ]);

    const totalIncome = Number(income._sum.totalAmount || 0);
    const totalExpenses = Number(expenses._sum.totalAmount || 0);

    // Calculate total commissions from professionals' income transactions
    let totalCommissions = 0;
    for (const prof of professionals) {
      if (Number(prof.commissionRate) <= 0) continue;
      const profIncome = await this.prisma.financialTransaction.aggregate({
        where: { tenantId, type: 'INCOME', status: 'PAID', professionalId: prof.id, ...dateFilter },
        _sum: { totalAmount: true },
      });
      totalCommissions += Number(profIncome._sum.totalAmount || 0) * Number(prof.commissionRate) / 100;
    }

    return {
      revenue: totalIncome,
      expenses: totalExpenses,
      commissions: totalCommissions,
      netProfit: totalIncome - totalExpenses - totalCommissions,
      pendingAmount: Number(pending._sum.totalAmount || 0),
      pendingCount: pending._count,
      overdueAmount: Number(overdue._sum.totalAmount || 0),
      overdueCount: overdue._count,
      transactionCount: income._count + expenses._count,
    };
  }

  async getDRE(tenantId: string, startDate?: string, endDate?: string) {
    const dateFilter = startDate && endDate
      ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
      : {};

    const [revenueByCategory, expensesByCategory, professionals] = await Promise.all([
      this.prisma.financialTransaction.groupBy({
        by: ['category'],
        where: { tenantId, type: 'INCOME', status: 'PAID', ...dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.financialTransaction.groupBy({
        by: ['category'],
        where: { tenantId, type: 'EXPENSE', status: 'PAID', ...dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.professional.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, commissionRate: true },
      }),
    ]);

    const revenueTotal = revenueByCategory.reduce((sum, r) => sum + Number(r._sum.totalAmount || 0), 0);
    const expensesTotal = expensesByCategory.reduce((sum, r) => sum + Number(r._sum.totalAmount || 0), 0);

    let totalCommissions = 0;
    for (const prof of professionals) {
      if (Number(prof.commissionRate) <= 0) continue;
      const profIncome = await this.prisma.financialTransaction.aggregate({
        where: { tenantId, type: 'INCOME', status: 'PAID', professionalId: prof.id, ...dateFilter },
        _sum: { totalAmount: true },
      });
      totalCommissions += Number(profIncome._sum.totalAmount || 0) * Number(prof.commissionRate) / 100;
    }

    const netOperating = revenueTotal - expensesTotal - totalCommissions;

    return {
      revenue: {
        total: revenueTotal,
        byCategory: revenueByCategory.map((r) => ({
          category: r.category || 'Sem categoria',
          total: Number(r._sum.totalAmount || 0),
          count: r._count,
        })),
      },
      deductions: {
        commissions: totalCommissions,
        taxes: 0,
      },
      expenses: {
        total: expensesTotal,
        byCategory: expensesByCategory.map((r) => ({
          category: r.category || 'Sem categoria',
          total: Number(r._sum.totalAmount || 0),
          count: r._count,
        })),
      },
      netOperating,
      netProfit: netOperating,
    };
  }

  async getCashFlow(tenantId: string, startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getFullYear(), end.getMonth() - 11, 1);

    const results = await this.prisma.$queryRaw<Array<{ month: string; income: number; expense: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN total_amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN total_amount ELSE 0 END), 0) as expense
      FROM financial_transactions
      WHERE tenant_id = ${tenantId}
        AND status = 'PAID'
        AND created_at >= ${start}::timestamp
        AND created_at <= ${end}::timestamp
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    const monthNames: Record<string, string> = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
    };

    return results.map((r) => {
      const monthNumber = r.month.split('-')[1];
      return {
        month: r.month,
        label: monthNames[monthNumber] || r.month,
        income: Number(r.income),
        expense: Number(r.expense),
        balance: Number(r.income) - Number(r.expense),
      };
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.financialTransaction.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Transação não encontrada');

    await this.prisma.financialTransaction.delete({ where: { id } });
    return { message: 'Transação excluída com sucesso' };
  }
}
