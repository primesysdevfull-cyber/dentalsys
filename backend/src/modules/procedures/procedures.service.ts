import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';

@Injectable()
export class ProceduresService {
  private readonly logger = new Logger(ProceduresService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProcedureDto) {
    if (dto.code) {
      const existing = await this.prisma.procedure.findFirst({
        where: { tenantId, code: dto.code },
      });
      if (existing) {
        throw new ConflictException(`Já existe um procedimento com o código ${dto.code}`);
      }
    }

    return this.prisma.procedure.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        defaultPrice: dto.defaultPrice,
        insurancePrice: dto.insurancePrice,
        durationMinutes: dto.durationMinutes ?? 30,
        isActive: dto.isActive ?? true,
        requiresAuthorization: dto.requiresAuthorization ?? false,
      },
    });
  }

  async findAll(tenantId: string, query: {
    search?: string;
    category?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, category, isActive, page: rawPage, limit: rawLimit } = query;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.procedure.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip,
        take: Number(limit),
      }),
      this.prisma.procedure.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const procedure = await this.prisma.procedure.findFirst({
      where: { id, tenantId },
    });
    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado');
    }
    return procedure;
  }

  async update(id: string, tenantId: string, dto: UpdateProcedureDto) {
    await this.findOne(id, tenantId);

    if (dto.code) {
      const existing = await this.prisma.procedure.findFirst({
        where: { tenantId, code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Já existe um procedimento com o código ${dto.code}`);
      }
    }

    return this.prisma.procedure.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.defaultPrice !== undefined && { defaultPrice: dto.defaultPrice }),
        ...(dto.insurancePrice !== undefined && { insurancePrice: dto.insurancePrice }),
        ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.requiresAuthorization !== undefined && { requiresAuthorization: dto.requiresAuthorization }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const procedure = await this.findOne(id, tenantId);

    const usageCount = await this.prisma.treatmentPlanItem.count({
      where: { procedureId: id },
    });
    if (usageCount > 0) {
      throw new ConflictException(
        `Não é possível excluir: procedimento vinculado a ${usageCount} plano(s) de tratamento. Desative ao invés de excluir.`,
      );
    }

    await this.prisma.procedure.delete({ where: { id } });
    return { message: 'Procedimento removido com sucesso' };
  }

  async getCategories(tenantId: string) {
    const result = await this.prisma.procedure.groupBy({
      by: ['category'],
      where: { tenantId, category: { not: null } },
      _count: true,
    });
    return result
      .filter((r) => r.category)
      .map((r) => ({ category: r.category, count: r._count }));
  }

  async getStats(tenantId: string) {
    const [total, active, byCategory] = await Promise.all([
      this.prisma.procedure.count({ where: { tenantId } }),
      this.prisma.procedure.count({ where: { tenantId, isActive: true } }),
      this.prisma.procedure.groupBy({
        by: ['category'],
        where: { tenantId },
        _count: true,
        _avg: { defaultPrice: true },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byCategory: byCategory
        .filter((r) => r.category)
        .map((r) => ({
          category: r.category,
          count: r._count,
          avgPrice: Number(r._avg.defaultPrice || 0),
        })),
    };
  }
}
