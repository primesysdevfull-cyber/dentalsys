import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MigrationService {
  constructor(private prisma: PrismaService) {}

  async exportAll(tenantId: string, userId: string) {
    const [patients, professionals, appointments, procedures, rooms, transactions, inventory, insurances] = await Promise.all([
      this.prisma.patient.findMany({ where: { tenantId } }),
      this.prisma.professional.findMany({ where: { tenantId } }),
      this.prisma.appointment.findMany({ where: { tenantId } }),
      this.prisma.procedure.findMany({ where: { tenantId } }),
      this.prisma.room.findMany({ where: { tenantId } }),
      this.prisma.financialTransaction.findMany({ where: { tenantId } }),
      this.prisma.inventoryItem.findMany({ where: { tenantId } }),
      this.prisma.insurance.findMany({ where: { tenantId } }),
    ]);

    const data = { patients, professionals, appointments, procedures, rooms, transactions, inventory, insurances };

    await this.prisma.migrationLog.create({
      data: {
        tenantId,
        direction: 'EXPORT',
        entityType: 'all',
        format: 'json',
        totalRows: Object.values(data).reduce((acc, arr) => acc + arr.length, 0),
        status: 'COMPLETED',
        createdBy: userId,
      },
    });

    return data;
  }

  async exportPatients(tenantId: string) {
    return this.prisma.patient.findMany({ where: { tenantId } });
  }

  async exportAppointments(tenantId: string) {
    return this.prisma.appointment.findMany({ where: { tenantId }, include: { patient: { select: { name: true } }, professional: { select: { name: true } } } });
  }

  async importPatients(tenantId: string, userId: string, patients: any[]) {
    const errors: any[] = [];
    let success = 0;

    for (let i = 0; i < patients.length; i++) {
      try {
        const p = patients[i];
        await this.prisma.patient.create({
          data: {
            tenantId,
            name: p.name || p.nome,
            cpf: p.cpf,
            rg: p.rg,
            email: p.email,
            phone: p.phone || p.telefone,
            whatsapp: p.whatsapp,
            address: p.address || p.endereco,
            city: p.city || p.cidade,
            state: p.state || p.estado,
            zipCode: p.zipCode || p.cep,
            birthDate: p.birthDate ? new Date(p.birthDate) : null,
            gender: p.gender,
            notes: p.notes,
            isActive: true,
          },
        });
        success++;
      } catch (err: any) {
        errors.push({ row: i + 1, name: patients[i]?.name || 'N/A', error: err.message });
      }
    }

    await this.prisma.migrationLog.create({
      data: {
        tenantId,
        direction: 'IMPORT',
        entityType: 'patients',
        format: 'json',
        totalRows: patients.length,
        successRows: success,
        errorRows: errors.length,
        errors,
        status: errors.length === patients.length ? 'ERROR' : errors.length > 0 ? 'PARTIAL' : 'COMPLETED',
        createdBy: userId,
      },
    });

    return { total: patients.length, success, errors, hasErrors: errors.length > 0 };
  }

  async importProcedures(tenantId: string, userId: string, procedures: any[]) {
    const errors: any[] = [];
    let success = 0;

    for (let i = 0; i < procedures.length; i++) {
      try {
        const p = procedures[i];
        await this.prisma.procedure.create({
          data: {
            tenantId,
            name: p.name || p.nome,
            code: p.code || p.codigo,
            category: p.category || p.categoria,
            defaultPrice: parseFloat(p.defaultPrice || p.preco || 0),
            insurancePrice: p.insurancePrice ? parseFloat(p.insurancePrice) : null,
            durationMinutes: p.duration ? parseInt(p.duration) : 30,
            isActive: true,
          },
        });
        success++;
      } catch (err: any) {
        errors.push({ row: i + 1, name: procedures[i]?.name || 'N/A', error: err.message });
      }
    }

    await this.prisma.migrationLog.create({
      data: {
        tenantId,
        direction: 'IMPORT',
        entityType: 'procedures',
        format: 'json',
        totalRows: procedures.length,
        successRows: success,
        errorRows: errors.length,
        errors,
        status: errors.length === procedures.length ? 'ERROR' : errors.length > 0 ? 'PARTIAL' : 'COMPLETED',
        createdBy: userId,
      },
    });

    return { total: procedures.length, success, errors, hasErrors: errors.length > 0 };
  }

  async getHistory(tenantId: string) {
    return this.prisma.migrationLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getTemplate(entityType: string) {
    if (entityType === 'patients') {
      return {
        columns: ['name', 'cpf', 'rg', 'email', 'phone', 'whatsapp', 'address', 'city', 'state', 'zipCode', 'birthDate', 'gender', 'notes'],
        sample: { name: 'João Silva', cpf: '123.456.789-00', email: 'joao@email.com', phone: '(11) 99999-8888', address: 'Rua Exemplo, 123', city: 'São Paulo', state: 'SP', zipCode: '01234-567' },
      };
    }
    if (entityType === 'procedures') {
      return {
        columns: ['name', 'code', 'category', 'defaultPrice', 'insurancePrice', 'duration'],
        sample: { name: 'Restauração', code: 'REST-001', category: 'RESTAURADORA', defaultPrice: 150.00, insurancePrice: 120.00, duration: 30 },
      };
    }
    throw new BadRequestException('Tipo inválido. Use: patients, procedures');
  }
}
