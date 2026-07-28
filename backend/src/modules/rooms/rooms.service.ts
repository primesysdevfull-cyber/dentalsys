import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        tenantId,
        name: dto.name,
        number: dto.number,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string) {
    const total = await this.prisma.room.count({ where: { tenantId } });
    const data = await this.prisma.room.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { appointments: true, assignments: true } },
      },
    });
    return { data, meta: { total, page: 1, limit: total, totalPages: 1 } };
  }

  async findOne(id: string, tenantId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { appointments: true, assignments: true } },
        assignments: {
          include: { professional: { select: { id: true, name: true } } },
          orderBy: { startTime: 'desc' },
          take: 5,
        },
      },
    });
    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }
    return room;
  }

  async update(id: string, tenantId: string, dto: UpdateRoomDto) {
    await this.findOne(id, tenantId);
    return this.prisma.room.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const room = await this.findOne(id, tenantId);

    const appointmentCount = await this.prisma.appointment.count({
      where: { roomId: id },
    });
    if (appointmentCount > 0) {
      throw new ConflictException(
        `Não é possível excluir: sala vinculada a ${appointmentCount} agendamento(s). Desative ao invés de excluir.`,
      );
    }

    await this.prisma.room.delete({ where: { id } });
    return { message: 'Sala removida com sucesso' };
  }

  async getStats(tenantId: string) {
    const [total, active] = await Promise.all([
      this.prisma.room.count({ where: { tenantId } }),
      this.prisma.room.count({ where: { tenantId, isActive: true } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const busyToday = await this.prisma.appointment.count({
      where: {
        roomId: { not: null },
        startTime: { gte: today },
        endTime: { lte: tomorrow },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    });

    return { total, active, inactive: total - active, busyToday };
  }
}
