import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicBookingDto } from './dto/booking.dto';

@Injectable()
export class OnlineBookingService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(professionalId: string, date: string) {
    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, isActive: true },
    });
    if (!professional) throw new BadRequestException('Profissional não encontrado');

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] },
      },
    });

    const slots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      const time = `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`;
      const conflict = appointments.some((a) => {
        const s = new Date(a.startTime).getTime();
        const e = new Date(a.endTime).getTime();
        const t = new Date(time).getTime();
        return t >= s && t < e;
      });
      if (!conflict) slots.push(time);
    }

    return { professionalId, date, availableSlots: slots };
  }

  async createBooking(dto: PublicBookingDto) {
    const professional = await this.prisma.professional.findFirst({
      where: { id: dto.professionalId, isActive: true },
      include: { tenant: true },
    });
    if (!professional) throw new BadRequestException('Profissional não encontrado');

    const tenantId = professional.tenantId;
    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        professionalId: dto.professionalId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: { notIn: ['CANCELLED'] },
      },
    });
    if (conflict) throw new BadRequestException('Horário indisponível');

    let patient = await this.prisma.patient.findFirst({
      where: { tenantId, phone: dto.patientPhone },
    });

    if (!patient) {
      patient = await this.prisma.patient.create({
        data: {
          tenantId,
          name: dto.patientName,
          phone: dto.patientPhone,
          email: dto.patientEmail,
        },
      });
    }

    return this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: patient.id,
        professionalId: dto.professionalId,
        startTime,
        endTime,
        status: 'SCHEDULED',
        source: 'WEBSITE',
        notes: dto.notes,
      },
      include: { patient: { select: { id: true, name: true } }, professional: { select: { id: true, name: true } } },
    });
  }

  async listProfessionals(tenantId: string) {
    return this.prisma.professional.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, specialty: true },
    });
  }
}
