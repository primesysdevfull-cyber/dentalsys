import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: {
    startDate?: string;
    endDate?: string;
    professionalId?: string;
    roomId?: string;
    status?: string;
    patientId?: string;
    page?: number;
    limit?: number;
  }) {
    const { startDate, endDate, professionalId, roomId, status, patientId, page: rawPage, limit: rawLimit } = query;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      ...(professionalId && { professionalId }),
      ...(roomId && { roomId }),
      ...(patientId && { patientId }),
      ...(status && { status: status as any }),
      ...(startDate && endDate && {
        startTime: { gte: new Date(startDate) },
        endTime: { lte: new Date(endDate) },
      }),
    };

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          patient: {
            select: { id: true, name: true, phone: true, whatsapp: true, photoUrl: true },
          },
          professional: {
            select: { id: true, name: true, color: true },
          },
          room: {
            select: { id: true, name: true },
          },
          procedure: {
            select: { id: true, name: true, durationMinutes: true, defaultPrice: true },
          },
        },
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        professional: true,
        room: true,
        procedure: true,
        clinicalRecord: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return appointment;
  }

  async create(tenantId: string, dto: CreateAppointmentDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('Horário de fim deve ser após o início');
    }

    // Verificar conflito de horário para o profissional
    const professionalConflict = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        professionalId: dto.professionalId,
        status: { notIn: ['CANCELLED'] },
        id: { not: dto.rescheduledFromId || '' },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (professionalConflict) {
      throw new ConflictException('Profissional já possui agendamento neste horário');
    }

    // Verificar conflito de sala
    if (dto.roomId) {
      const roomConflict = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          roomId: dto.roomId,
          status: { notIn: ['CANCELLED'] },
          id: { not: dto.rescheduledFromId || '' },
          OR: [
            { startTime: { lt: endTime }, endTime: { gt: startTime } },
          ],
        },
      });

      if (roomConflict) {
        throw new ConflictException('Sala já reservada neste horário');
      }
    }

    // Verificar limite máximo de consultas por dia do profissional
    const prof = await this.prisma.professional.findUnique({
      where: { id: dto.professionalId },
      select: { userId: true },
    });

    if (prof?.userId) {
      const userWithLimit = await this.prisma.user.findUnique({
        where: { id: prof.userId },
        select: { maxAppointmentsPerDay: true },
      });

      if (userWithLimit?.maxAppointmentsPerDay) {
        const dayStart = new Date(startTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(startTime);
        dayEnd.setHours(23, 59, 59, 999);

        const dayCount = await this.prisma.appointment.count({
          where: {
            tenantId,
            professionalId: dto.professionalId,
            status: { notIn: ['CANCELLED'] },
            id: { not: dto.rescheduledFromId || '' },
            startTime: { gte: dayStart, lte: dayEnd },
          },
        });

        if (dayCount >= userWithLimit.maxAppointmentsPerDay) {
          throw new BadRequestException(
            `Profissional atingiu o limite máximo de ${userWithLimit.maxAppointmentsPerDay} consultas para este dia`,
          );
        }
      }
    }

    // Verificar bloqueios de agenda
    const block = await this.prisma.scheduleBlock.findFirst({
      where: {
        tenantId,
        OR: [
          { professionalId: dto.professionalId },
          { professionalId: null },
        ],
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (block) {
      throw new ConflictException(`Horário bloqueado: ${block.title}`);
    }

    return this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        professionalId: dto.professionalId,
        roomId: dto.roomId,
        procedureId: dto.procedureId,
        startTime,
        endTime,
        status: 'SCHEDULED',
        source: (dto.source as any) || 'SYSTEM',
        notes: dto.notes,
        rescheduledFromId: dto.rescheduledFromId,
      },
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true, color: true } },
        room: { select: { id: true, name: true } },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateAppointmentDto) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const data: any = { ...dto };
    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async cancel(tenantId: string, id: string, reason?: string) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (existing.status === 'COMPLETED') {
      throw new BadRequestException('Não é possível cancelar agendamento concluído');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    });
  }

  async confirm(tenantId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmationSent: true },
    });
  }

  async startSession(tenantId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async complete(tenantId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async reschedule(tenantId: string, id: string, dto: CreateAppointmentDto) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Cancelar o antigo
    await this.prisma.appointment.update({
      where: { id },
      data: { status: 'RESCHEDULED' },
    });

    // Criar novo
    return this.create(tenantId, { ...dto, rescheduledFromId: id });
  }

  async getAvailableSlots(tenantId: string, professionalId: string, date: string, procedureId?: string) {
    const dayStart = new Date(date);
    dayStart.setHours(8, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    const [appointments, blocks, professional] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          tenantId,
          professionalId,
          status: { notIn: ['CANCELLED'] },
          startTime: { gte: dayStart },
          endTime: { lte: dayEnd },
        },
        select: { startTime: true, endTime: true },
      }),
      this.prisma.scheduleBlock.findMany({
        where: {
          tenantId,
          OR: [{ professionalId }, { professionalId: null }],
          startTime: { lt: dayEnd },
          endTime: { gt: dayStart },
        },
        select: { startTime: true, endTime: true },
      }),
      this.prisma.professional.findUnique({
        where: { id: professionalId },
        select: { workingHours: true, userId: true },
      }),
    ]);

    const userLimit = professional?.userId
      ? await this.prisma.user.findUnique({
          where: { id: professional.userId },
          select: { maxAppointmentsPerDay: true },
        })
      : null;

    const maxPerDay = userLimit?.maxAppointmentsPerDay;
    const appointmentCount = appointments.length;

    // Se atingiu o limite diário, retorna slots vazios
    if (maxPerDay && appointmentCount >= maxPerDay) {
      return {
        date,
        professionalId,
        duration: 0,
        slots: [],
        maxAppointmentsPerDay: maxPerDay,
        appointmentCount,
        limitReached: true,
      };
    }

    const duration = procedureId
      ? (await this.prisma.procedure.findUnique({ where: { id: procedureId }, select: { durationMinutes: true } }))?.durationMinutes || 30
      : 30;

    const slots: string[] = [];
    const current = new Date(dayStart);

    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + duration * 60000);

      if (slotEnd > dayEnd) break;

      const isOccupied = appointments.some(
        (a) => a.startTime < slotEnd && a.endTime > current,
      );

      const isBlocked = blocks.some(
        (b) => b.startTime < slotEnd && b.endTime > current,
      );

      if (!isOccupied && !isBlocked) {
        slots.push(current.toISOString());
      }

      current.setMinutes(current.getMinutes() + 30);
    }

    return {
      date,
      professionalId,
      duration,
      slots,
      maxAppointmentsPerDay: maxPerDay || null,
      appointmentCount,
      limitReached: false,
    };
  }

  async getCalendarView(tenantId: string, startDate: string, endDate: string, professionalId?: string) {
    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      startTime: { gte: new Date(startDate) },
      endTime: { lte: new Date(endDate) },
      ...(professionalId && { professionalId }),
    };

    const [appointments, professionals, rooms, blocks] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, photoUrl: true } },
          professional: { select: { id: true, name: true, color: true } },
          room: { select: { id: true, name: true } },
          procedure: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.professional.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, color: true },
      }),
      this.prisma.room.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true },
      }),
      this.prisma.scheduleBlock.findMany({
        where: {
          tenantId,
          startTime: { gte: new Date(startDate) },
          endTime: { lte: new Date(endDate) },
        },
      }),
    ]);

    return { appointments, professionals, rooms, blocks };
  }
}
