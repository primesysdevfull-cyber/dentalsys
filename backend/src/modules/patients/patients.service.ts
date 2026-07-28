import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: {
    search?: string;
    page?: number;
    limit?: number;
    insuranceId?: string;
    isActive?: boolean;
  }) {
    const { search, page: rawPage, limit: rawLimit, insuranceId, isActive } = query;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
      ...(insuranceId && { insuranceId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { whatsapp: { contains: search } },
        ],
      }),
    };

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: {
          insurance: { select: { id: true, name: true } },
          _count: {
            select: { appointments: true, clinicalRecords: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
      include: {
        insurance: true,
        medicalHistory: true,
        guardians: true,
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        odontogram: {
          include: { teeth: true },
        },
        treatmentPlans: {
          include: { items: { include: { procedure: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { appointments: true, clinicalRecords: true },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return patient;
  }

  async create(tenantId: string, dto: CreatePatientDto) {
    const { medicalHistory, guardians, ...patientData } = dto;

    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        name: patientData.name,
        cpf: patientData.cpf,
        rg: patientData.rg,
        birthDate: patientData.birthDate ? new Date(patientData.birthDate) : undefined,
        gender: patientData.gender as any,
        email: patientData.email,
        phone: patientData.phone,
        whatsapp: patientData.whatsapp,
        address: patientData.address,
        city: patientData.city,
        state: patientData.state,
        zipCode: patientData.zipCode,
        occupation: patientData.occupation,
        notes: patientData.notes,
        insuranceId: patientData.insuranceId,
        insuranceNumber: patientData.insuranceNumber,
        insuranceValidUntil: patientData.insuranceValidUntil ? new Date(patientData.insuranceValidUntil) : undefined,
        emergencyContactName: patientData.emergencyContactName,
        emergencyContactPhone: patientData.emergencyContactPhone,
        emergencyContactRelation: patientData.emergencyContactRelation,
        legalGuardianName: patientData.legalGuardianName,
        legalGuardianCpf: patientData.legalGuardianCpf,
        legalGuardianPhone: patientData.legalGuardianPhone,
        legalGuardianRelation: patientData.legalGuardianRelation,
        medicalHistory: medicalHistory
          ? { create: medicalHistory }
          : undefined,
        guardians: guardians
          ? { create: guardians }
          : undefined,
      },
      include: {
        medicalHistory: true,
        guardians: true,
      },
    });

    return patient;
  }

  async update(tenantId: string, id: string, dto: UpdatePatientDto) {
    const existing = await this.prisma.patient.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Paciente não encontrado');
    }

    const { medicalHistory, guardians, ...patientData } = dto;

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...(patientData.name !== undefined && { name: patientData.name }),
        ...(patientData.cpf !== undefined && { cpf: patientData.cpf }),
        ...(patientData.rg !== undefined && { rg: patientData.rg }),
        ...(patientData.birthDate !== undefined && { birthDate: patientData.birthDate ? new Date(patientData.birthDate) : null }),
        ...(patientData.gender !== undefined && { gender: patientData.gender as any }),
        ...(patientData.email !== undefined && { email: patientData.email }),
        ...(patientData.phone !== undefined && { phone: patientData.phone }),
        ...(patientData.whatsapp !== undefined && { whatsapp: patientData.whatsapp }),
        ...(patientData.address !== undefined && { address: patientData.address }),
        ...(patientData.city !== undefined && { city: patientData.city }),
        ...(patientData.state !== undefined && { state: patientData.state }),
        ...(patientData.zipCode !== undefined && { zipCode: patientData.zipCode }),
        ...(patientData.occupation !== undefined && { occupation: patientData.occupation }),
        ...(patientData.notes !== undefined && { notes: patientData.notes }),
        ...(patientData.insuranceNumber !== undefined && { insuranceNumber: patientData.insuranceNumber }),
        ...(patientData.insuranceValidUntil !== undefined && { insuranceValidUntil: patientData.insuranceValidUntil ? new Date(patientData.insuranceValidUntil) : null }),
        ...(patientData.emergencyContactName !== undefined && { emergencyContactName: patientData.emergencyContactName }),
        ...(patientData.emergencyContactPhone !== undefined && { emergencyContactPhone: patientData.emergencyContactPhone }),
        ...(patientData.emergencyContactRelation !== undefined && { emergencyContactRelation: patientData.emergencyContactRelation }),
        ...(patientData.legalGuardianName !== undefined && { legalGuardianName: patientData.legalGuardianName }),
        ...(patientData.legalGuardianCpf !== undefined && { legalGuardianCpf: patientData.legalGuardianCpf }),
        ...(patientData.legalGuardianPhone !== undefined && { legalGuardianPhone: patientData.legalGuardianPhone }),
        ...(patientData.legalGuardianRelation !== undefined && { legalGuardianRelation: patientData.legalGuardianRelation }),
        medicalHistory: medicalHistory
          ? {
              upsert: {
                create: medicalHistory,
                update: medicalHistory,
              },
            }
          : undefined,
      },
      include: {
        medicalHistory: true,
        guardians: true,
      },
    });

    return patient;
  }

  async getMedicalHistory(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      include: { medicalHistory: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return patient.medicalHistory;
  }

  async updateMedicalHistory(tenantId: string, patientId: string, dto: CreateMedicalHistoryDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return this.prisma.medicalHistory.upsert({
      where: { patientId },
      create: { patientId, ...dto },
      update: dto,
    });
  }

  async addAttachment(tenantId: string, patientId: string, dto: CreateAttachmentDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return this.prisma.patientAttachment.create({
      data: {
        patientId,
        type: dto.type as any,
        title: dto.title,
        description: dto.description,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
      },
    });
  }

  async getAttachments(tenantId: string, patientId: string, type?: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return this.prisma.patientAttachment.findMany({
      where: {
        patientId,
        ...(type && { type: type as any }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAttachment(tenantId: string, patientId: string, attachmentId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    const attachment = await this.prisma.patientAttachment.findFirst({
      where: { id: attachmentId, patientId },
    });

    if (!attachment) {
      throw new NotFoundException('Anexo não encontrado');
    }

    await this.prisma.patientAttachment.delete({ where: { id: attachmentId } });
    return { message: 'Anexo removido com sucesso' };
  }

  async addGuardian(tenantId: string, patientId: string, dto: any) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return this.prisma.patientGuardian.create({
      data: { patientId, ...dto },
    });
  }

  async removeGuardian(tenantId: string, patientId: string, guardianId: string) {
    await this.prisma.patientGuardian.deleteMany({
      where: { id: guardianId, patientId },
    });
    return { message: 'Responsável removido com sucesso' };
  }

  async getPatientStats(tenantId: string) {
    const totalPatients = await this.prisma.patient.count({
      where: { tenantId, isActive: true },
    });

    const newThisMonth = await this.prisma.patient.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const withInsurance = await this.prisma.patient.count({
      where: { tenantId, isActive: true, insuranceId: { not: null } },
    });

    return {
      totalPatients,
      newThisMonth,
      withInsurance,
      withoutInsurance: totalPatients - withInsurance,
    };
  }
}
