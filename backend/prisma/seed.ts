import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Criar tenant demo
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Clínica Dental Sorriso',
      tradeName: 'Sorriso Dental',
      cnpj: '12.345.678/0001-90',
      email: 'contato@sorrisodental.com.br',
      phone: '(11) 3456-7890',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      settings: {
        workingHoursStart: '08:00',
        workingHoursEnd: '18:00',
        slotDuration: 30,
        appointmentReminderHours: 24,
        acceptWhatsApp: true,
        acceptSMS: false,
      },
      subscription: {
        plan: 'professional',
        maxUsers: 10,
        maxPatients: 1000,
        features: ['appointments', 'clinical-records', 'billing', 'inventory', 'reports'],
      },
    },
  });

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Dr. Carlos Silva',
      email: 'admin@clinica.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      phone: '(11) 99999-9999',
    },
  });

  // Criar usuário recepcionista
  const recepPassword = await bcrypt.hash('Recep@123', 12);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Maria Santos',
      email: 'recepcao@clinica.com',
      password: recepPassword,
      role: UserRole.RECEPTIONIST,
    },
  });

  // Criar profissionais
  const dentist1 = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      name: 'Dr. Carlos Silva',
      croNumber: 'CRO-SP 12345',
      specialty: 'Clínica Geral e Endodontia',
      color: '#3B82F6',
      commissionRate: 40,
    },
  });

  const dentist2 = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      name: 'Dra. Ana Oliveira',
      croNumber: 'CRO-SP 67890',
      specialty: 'Ortodontia e Prótese',
      color: '#EC4899',
      commissionRate: 40,
    },
  });

  // Criar salas
  await prisma.room.createMany({
    data: [
      { tenantId: tenant.id, name: 'Consultório 1', number: 1 },
      { tenantId: tenant.id, name: 'Consultório 2', number: 2 },
      { tenantId: tenant.id, name: 'Sala de Procedimentos', number: 3 },
    ],
  });

  // Criar convênio
  const insurance = await prisma.insurance.create({
    data: {
      tenantId: tenant.id,
      name: 'Amil Dental',
      cnpj: '98.765.432/0001-10',
      phone: '(11) 4002-1234',
    },
  });

  // Criar procedimentos - Catálogo CDT
  const procedures = await prisma.procedure.createMany({
    data: [
      // Consultas
      { tenantId: tenant.id, code: 'D0120', name: 'Consulta de Rotina', defaultPrice: 120, durationMinutes: 30, category: 'Consulta' },
      { tenantId: tenant.id, code: 'D0150', name: 'Avaliação Extraoral', defaultPrice: 80, durationMinutes: 20, category: 'Consulta' },
      { tenantId: tenant.id, code: 'D0160', name: 'Avaliação Intraoral Completa', defaultPrice: 150, durationMinutes: 40, category: 'Consulta' },
      { tenantId: tenant.id, code: 'D0180', name: 'Avaliação Periápica', defaultPrice: 100, durationMinutes: 30, category: 'Diagnóstico' },

      // Prevenção
      { tenantId: tenant.id, code: 'D1110', name: 'Profilaxia (Limpeza)', defaultPrice: 180, durationMinutes: 45, category: 'Prevenção' },
      { tenantId: tenant.id, code: 'D1120', name: 'Profilaxia (Criança)', defaultPrice: 120, durationMinutes: 30, category: 'Prevenção' },
      { tenantId: tenant.id, code: 'D1206', name: 'Aplicação Tópica de Flúor', defaultPrice: 60, durationMinutes: 20, category: 'Prevenção' },
      { tenantId: tenant.id, code: 'D1351', name: 'Selante por Dente', defaultPrice: 80, durationMinutes: 20, category: 'Prevenção' },
      { tenantId: tenant.id, code: 'D1510', name: 'Manutenção Aparelho Ortodôntico', defaultPrice: 200, durationMinutes: 30, category: 'Prevenção' },

      // Diagnóstico por imagem
      { tenantId: tenant.id, code: 'D0210', name: 'Radiografia Periapical', defaultPrice: 30, durationMinutes: 10, category: 'Diagnóstico' },
      { tenantId: tenant.id, code: 'D0220', name: 'Radiografia Oclusal', defaultPrice: 40, durationMinutes: 10, category: 'Diagnóstico' },
      { tenantId: tenant.id, code: 'D0272', name: 'Radiografia Interproximal (2 filmes)', defaultPrice: 60, durationMinutes: 15, category: 'Diagnóstico' },
      { tenantId: tenant.id, code: 'D0274', name: 'Radiografia Interproximal (4 filmes)', defaultPrice: 100, durationMinutes: 20, category: 'Diagnóstico' },
      { tenantId: tenant.id, code: 'D0330', name: 'Radiografia Panorâmica', defaultPrice: 120, durationMinutes: 15, category: 'Diagnóstico' },
      { tenantId: tenant.id, code: 'D0340', name: 'Telerradiografia Lateral', defaultPrice: 150, durationMinutes: 15, category: 'Diagnóstico' },
      { tenantId: tenant.id, code: 'D0364', name: 'Tomografia (CBCT)', defaultPrice: 500, durationMinutes: 30, category: 'Diagnóstico' },

      // Restaurações
      { tenantId: tenant.id, code: 'D2140', name: 'Restauração Amálgama (1 superfície)', defaultPrice: 150, durationMinutes: 30, category: 'Restauradora' },
      { tenantId: tenant.id, code: 'D2150', name: 'Restauração Amálgama (2 superfícies)', defaultPrice: 200, durationMinutes: 40, category: 'Restauradora' },
      { tenantId: tenant.id, code: 'D2330', name: 'Restauração Resina (1 superfície)', defaultPrice: 180, durationMinutes: 30, category: 'Restauradora' },
      { tenantId: tenant.id, code: 'D2331', name: 'Restauração Resina (2 superfícies)', defaultPrice: 230, durationMinutes: 40, category: 'Restauradora' },
      { tenantId: tenant.id, code: 'D2332', name: 'Restauração Resina (3 superfícies)', defaultPrice: 280, durationMinutes: 50, category: 'Restauradora' },
      { tenantId: tenant.id, code: 'D2335', name: 'Restauração Resina (4+ superfícies)', defaultPrice: 350, durationMinutes: 60, category: 'Restauradora' },
      { tenantId: tenant.id, code: 'D2391', name: 'Restauração Resina (1 face anterior)', defaultPrice: 200, durationMinutes: 30, category: 'Restauradora' },

      // Endodontia
      { tenantId: tenant.id, code: 'D3220', name: 'Pulpotomia', defaultPrice: 350, durationMinutes: 45, category: 'Endodontia' },
      { tenantId: tenant.id, code: 'D3310', name: 'Tratamento Endodôntico (Incisivo/Cuspidante)', defaultPrice: 600, durationMinutes: 60, category: 'Endodontia' },
      { tenantId: tenant.id, code: 'D3320', name: 'Tratamento Endodôntico (Premolar)', defaultPrice: 800, durationMinutes: 75, category: 'Endodontia' },
      { tenantId: tenant.id, code: 'D3330', name: 'Tratamento Endodôntico (Molar)', defaultPrice: 1000, durationMinutes: 90, category: 'Endodontia' },
      { tenantId: tenant.id, code: 'D3346', name: 'Retratamento Endodôntico (Molar)', defaultPrice: 1200, durationMinutes: 100, category: 'Endodontia' },
      { tenantId: tenant.id, code: 'D3410', name: 'Apicectomia', defaultPrice: 900, durationMinutes: 90, category: 'Endodontia' },
      { tenantId: tenant.id, code: 'D3421', name: 'Apicectomia com Retrocimento', defaultPrice: 1100, durationMinutes: 100, category: 'Endodontia' },

      // Cirurgia
      { tenantId: tenant.id, code: 'D7110', name: 'Extração Simples', defaultPrice: 250, durationMinutes: 30, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7120', name: 'Extração Simples (Dente Decíduo)', defaultPrice: 150, durationMinutes: 20, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7140', name: 'Extração Cirúrgica', defaultPrice: 450, durationMinutes: 60, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7210', name: 'Extração de Dente Incluso', defaultPrice: 600, durationMinutes: 75, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7220', name: 'Remoção de Dente Incluso Semi-incluso', defaultPrice: 500, durationMinutes: 60, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7230', name: 'Remoção de Dente Impactado', defaultPrice: 700, durationMinutes: 90, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7250', name: 'Coronectomia', defaultPrice: 800, durationMinutes: 90, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7260', name: 'Alvéolotomia', defaultPrice: 150, durationMinutes: 20, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7270', name: 'Biópsia', defaultPrice: 400, durationMinutes: 40, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7280', name: 'Frenectomia Labial', defaultPrice: 500, durationMinutes: 40, category: 'Cirurgia' },
      { tenantId: tenant.id, code: 'D7310', name: 'Alveoloplastia', defaultPrice: 600, durationMinutes: 60, category: 'Cirurgia' },

      // Implantodontia
      { tenantId: tenant.id, code: 'D6010', name: 'Implante Dentário (Corpo)', defaultPrice: 3500, durationMinutes: 90, category: 'Implantodontia' },
      { tenantId: tenant.id, code: 'D6040', name: 'Prótese sobre Implante (Coroa)', defaultPrice: 2500, durationMinutes: 60, category: 'Implantodontia' },
      { tenantId: tenant.id, code: 'D6056', name: 'Prótese Fixa sobre Implante (3 elementos)', defaultPrice: 6000, durationMinutes: 90, category: 'Implantodontia' },
      { tenantId: tenant.id, code: 'D6058', name: 'Prótese Fixa sobre Implante (5+ elementos)', defaultPrice: 10000, durationMinutes: 120, category: 'Implantodontia' },
      { tenantId: tenant.id, code: 'D6100', name: 'Enxerto Ósseo', defaultPrice: 3000, durationMinutes: 90, category: 'Implantodontia' },
      { tenantId: tenant.id, code: 'D6190', name: 'Revisão de Implante', defaultPrice: 300, durationMinutes: 30, category: 'Implantodontia' },

      // Prótese
      { tenantId: tenant.id, code: 'D6240', name: 'Prótese Parcial Removível (Acrílica)', defaultPrice: 1200, durationMinutes: 60, category: 'Prótese' },
      { tenantId: tenant.id, code: 'D6250', name: 'Prótese Parcial Removível (Metálica)', defaultPrice: 2500, durationMinutes: 60, category: 'Prótese' },
      { tenantId: tenant.id, code: 'D6710', name: 'Prótese Total (Acrílica)', defaultPrice: 1800, durationMinutes: 60, category: 'Prótese' },
      { tenantId: tenant.id, code: 'D6720', name: 'Prótese Total (Flexible/Nylon)', defaultPrice: 2200, durationMinutes: 60, category: 'Prótese' },
      { tenantId: tenant.id, code: 'D6740', name: 'Prótese Total (Protocolo)', defaultPrice: 8000, durationMinutes: 90, category: 'Prótese' },
      { tenantId: tenant.id, code: 'D6750', name: 'Coroa Cerâmica', defaultPrice: 1800, durationMinutes: 60, category: 'Prótese' },
      { tenantId: tenant.id, code: 'D6780', name: 'Ponte Fixa (3 elementos)', defaultPrice: 5000, durationMinutes: 90, category: 'Prótese' },

      // Ortodontia
      { tenantId: tenant.id, code: 'D8080', name: 'Aparelho Ortodôntico Fixo (Arcada)', defaultPrice: 4500, durationMinutes: 60, category: 'Ortodontia' },
      { tenantId: tenant.id, code: 'D8090', name: 'Aparelho Ortodôntico Fixo (Duas Arcadas)', defaultPrice: 8000, durationMinutes: 90, category: 'Ortodontia' },
      { tenantId: tenant.id, code: 'D8680', name: 'Manutenção Ortodôntica', defaultPrice: 200, durationMinutes: 30, category: 'Ortodontia' },
      { tenantId: tenant.id, code: 'D8700', name: 'Aparelho Removível', defaultPrice: 2000, durationMinutes: 30, category: 'Ortodontia' },
      { tenantId: tenant.id, code: 'D8990', name: 'Ortodontia Interceptiva', defaultPrice: 3000, durationMinutes: 60, category: 'Ortodontia' },

      // Estética
      { tenantId: tenant.id, code: 'D9975', name: 'Clareamento Dental (Consultório)', defaultPrice: 1200, durationMinutes: 90, category: 'Estética' },
      { tenantId: tenant.id, code: 'D9976', name: 'Clareamento Dental (Caseiro)', defaultPrice: 800, durationMinutes: 30, category: 'Estética' },
      { tenantId: tenant.id, code: 'D9977', name: 'Lentes de Contato Dental', defaultPrice: 1500, durationMinutes: 60, category: 'Estética' },
      { tenantId: tenant.id, code: 'D9978', name: 'Contorno Gengival', defaultPrice: 400, durationMinutes: 40, category: 'Estética' },
    ],
  });

  // Criar pacientes demo
  const patient1 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      name: 'João da Silva',
      cpf: '123.456.789-00',
      birthDate: new Date('1985-03-15'),
      gender: 'MALE',
      email: 'joao@email.com',
      phone: '(11) 98765-4321',
      whatsapp: '(11) 98765-4321',
      address: 'Rua A, 100',
      city: 'São Paulo',
      state: 'SP',
      insuranceId: insurance.id,
      insuranceNumber: 'AMIL-123456',
      medicalHistory: {
        create: {
          allergies: 'Penicilina',
          chronicDiseases: 'Hipertensão controlada',
          currentMedications: 'Losartana 50mg',
          dentalHistory: 'Restaurações nos dentes 36 e 46',
        },
      },
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      name: 'Maria Fernanda Costa',
      cpf: '987.654.321-00',
      birthDate: new Date('1992-07-22'),
      gender: 'FEMALE',
      email: 'maria@email.com',
      phone: '(11) 97654-3210',
    },
  });

  // Criar agendamentos demo
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patient1.id,
      professionalId: dentist1.id,
      procedureId: undefined,
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 30),
      status: 'SCHEDULED',
      source: 'PHONE',
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patient2.id,
      professionalId: dentist2.id,
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 45),
      status: 'CONFIRMED',
      source: 'WHATSAPP',
    },
  });

  // Criar item de estoque
  await prisma.inventoryItem.createMany({
    data: [
      { tenantId: tenant.id, name: 'Anestesia Lidocaína 2%', category: 'Anestésicos', unit: 'ml', currentStock: 50, minStock: 10, unitCost: 1.50, expiryDate: new Date('2025-06-30') },
      { tenantId: tenant.id, name: 'Algodão Estéril', category: 'Materiais Gerais', unit: 'pacote', currentStock: 20, minStock: 5, unitCost: 8.00 },
      { tenantId: tenant.id, name: 'Luva de Procedimento (M)', category: 'Proteção', unit: 'caixa', currentStock: 3, minStock: 5, unitCost: 25.00 },
      { tenantId: tenant.id, name: 'Resina Composta Filtek', category: 'Restauração', unit: 'cápsula', currentStock: 15, minStock: 5, unitCost: 45.00 },
      { tenantId: tenant.id, name: 'Soro Fisiológico 0.9%', category: 'Medicamentos', unit: 'ml', currentStock: 200, minStock: 50, unitCost: 0.05 },
    ],
  });

  console.log('Seed completed!');
  console.log('---');
  console.log('Tenant:', tenant.name, `(ID: ${tenant.id})`);
  console.log('Admin login: admin@clinica.com / Admin@123');
  console.log('Recepção login: recepcao@clinica.com / Recep@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
