import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, category, lowStock, expiringSoon, page: rawPage, limit: rawLimit } = query;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = {
      tenantId,
      isActive: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    // Separar itens com estoque baixo
    const lowStockItems = items.filter((item) => item.currentStock <= item.minStock);

    // Itens vencendo em 30 dias
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringItems = items.filter(
      (item) => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow,
    );

    return {
      data: lowStock ? lowStockItems : items,
      lowStockItems,
      expiringItems,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!item) throw new NotFoundException('Item não encontrado');
    return item;
  }

  async create(tenantId: string, dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    return this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
    });
  }

  async addMovement(tenantId: string, itemId: string, dto: CreateMovementDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId },
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    let newStock = item.currentStock;

    switch (dto.type) {
      case 'ENTRY':
      case 'RETURN':
        newStock += dto.quantity;
        break;
      case 'EXIT':
        if (dto.quantity > item.currentStock) {
          throw new BadRequestException('Quantidade insuficiente em estoque');
        }
        newStock -= dto.quantity;
        break;
      case 'ADJUSTMENT':
        newStock = dto.quantity;
        break;
    }

    const [movement] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.create({
        data: {
          tenantId,
          itemId,
          type: dto.type as any,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          totalCost: dto.totalCost,
          reason: dto.reason,
          invoiceNumber: dto.invoiceNumber,
        },
      }),
      this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: newStock },
      }),
    ]);

    // Alertar estoque baixo
    if (newStock <= item.minStock) {
      // TODO: Enviar notificação
    }

    return { movement, currentStock: newStock };
  }

  async getLowStockAlert(tenantId: string) {
    const allItems = await this.prisma.inventoryItem.findMany({
      where: { tenantId, isActive: true },
    });

    return allItems.filter((item) => item.currentStock <= item.minStock);
  }

  async getExpiringAlert(tenantId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const allItems = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        isActive: true,
        expiryDate: { not: null },
      },
    });

    return allItems.filter(
      (item) => item.expiryDate && new Date(item.expiryDate) <= futureDate,
    );
  }

  async getStats(tenantId: string) {
    const allItems = await this.prisma.inventoryItem.findMany({
      where: { tenantId, isActive: true },
    });

    const totalItems = allItems.length;
    const lowStockCount = allItems.filter((i) => i.currentStock <= i.minStock).length;
    const totalValue = allItems.reduce(
      (sum, i) => sum + (Number(i.unitCost) || 0) * i.currentStock,
      0,
    );

    return { totalItems, lowStockCount, totalValue };
  }
}
