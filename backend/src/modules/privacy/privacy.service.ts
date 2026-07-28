import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GiveConsentDto, RevokeConsentDto, RequestDataExportDto } from './dto/privacy.dto';

@Injectable()
export class PrivacyService {
  constructor(private prisma: PrismaService) {}

  async getConsents(tenantId: string, patientId?: string) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    return this.prisma.privacyConsent.findMany({
      where,
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async giveConsent(tenantId: string, dto: GiveConsentDto) {
    const patient = await this.prisma.patient.findFirst({ where: { id: dto.patientId, tenantId } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');

    return this.prisma.privacyConsent.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        type: dto.type as any,
        status: 'GRANTED',
        consentVersion: dto.consentVersion || 'v1',
      },
    });
  }

  async revokeConsent(tenantId: string, dto: RevokeConsentDto) {
    const consent = await this.prisma.privacyConsent.findFirst({
      where: { tenantId, patientId: dto.patientId, type: dto.type as any, status: 'GRANTED' },
    });
    if (!consent) throw new NotFoundException('Consentimento ativo não encontrado');

    return this.prisma.privacyConsent.update({
      where: { id: consent.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
  }

  async requestDataExport(tenantId: string, dto: RequestDataExportDto, userId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
      include: {
        appointments: true,
        clinicalRecords: true,
        financialTransactions: true,
      },
    });
    if (!patient) throw new NotFoundException('Paciente não encontrado');

    const request = await this.prisma.dataExportRequest.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        requestedBy: userId,
        status: 'COMPLETED',
      },
    });

    return {
      id: request.id,
      message: 'Solicitação de exportação registrada',
      patient: {
        name: patient.name,
        cpf: patient.cpf,
        email: patient.email,
        phone: patient.phone,
        appointmentsCount: patient.appointments.length,
        recordsCount: patient.clinicalRecords.length,
        transactionsCount: patient.financialTransactions.length,
      },
    };
  }

  async getExportRequests(tenantId: string) {
    return this.prisma.dataExportRequest.findMany({
      where: { tenantId },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async anonymizePatient(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    if (patient.dataAnonymizedAt) throw new BadRequestException('Paciente já anonimizado');

    const hash = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        name: hash,
        cpf: null,
        rg: null,
        email: null,
        phone: null,
        whatsapp: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        occupation: null,
        photoUrl: null,
        insuranceId: null,
        insuranceNumber: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelation: null,
        legalGuardianName: null,
        legalGuardianCpf: null,
        legalGuardianPhone: null,
        legalGuardianRelation: null,
        isActive: false,
        dataAnonymizedAt: new Date(),
      },
    });

    return { message: 'Dados do paciente anonimizados com sucesso. O registro foi mantido para auditoria.' };
  }
}
