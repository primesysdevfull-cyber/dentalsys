import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

let app: INestApplication;
let prisma: PrismaService;
let testTenantId: string;
let testUserId: string;
let testAccessToken: string;

export const getTestApp = () => app;
export const getPrisma = () => prisma;
export const getTestTenantId = () => testTenantId;
export const getTestUserId = () => testUserId;
export const getTestAccessToken = () => testAccessToken;

const uniqueSuffix = () => Math.random().toString(36).substring(2, 8);
const timestamp = () => Date.now();

export async function bootstrapTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useFactory({
      factory: () => {
        const service = new PrismaService();
        return service;
      },
    })
    .compile();

  app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  prisma = app.get(PrismaService);
  await prisma.$connect();

  return app;
}

export async function createTestTenantAndUser(overrides?: {
  email?: string;
  name?: string;
  clinicName?: string;
}) {
  const suffix = uniqueSuffix();
  const email = overrides?.email || `admin+${suffix}@testclinic.com`;
  const name = overrides?.name || `Test Admin ${suffix}`;
  const clinicName = overrides?.clinicName || `Test Clinic ${suffix}`;
  const password = 'TestPassword@123';

  const registerResponse = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({
      name,
      email,
      password,
      clinicName,
      cnpj: `${Math.floor(Math.random() * 99999999).toString().padStart(8, '0')}/0001-${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
      phone: `(11) ${Math.floor(Math.random() * 900000000 + 100000000)}`,
    });

  const body = registerResponse.body;

  testTenantId = body.user?.id ? await extractTenantId(email) : testTenantId;
  testUserId = body.user?.id || testUserId;
  testAccessToken = body.accessToken || testAccessToken;

  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    user: body.user,
    tenantId: testTenantId,
    userId: testUserId,
  };
}

async function extractTenantId(email: string): Promise<string> {
  const user = await prisma.user.findFirst({ where: { email } });
  return user?.tenantId || '';
}

export async function getAuthToken(
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password });

  return response.body.accessToken;
}

export async function cleanupTestDatabase() {
  if (!prisma) return;
  try {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "audit_logs", "notifications", "installments",
       "financial_transactions", "odontogram_teeth", "odontograms",
       "treatment_plan_items", "treatment_plans", "clinical_records",
       "appointments", "patient_attachments", "patient_guardians",
       "medical_histories", "patients", "schedule_blocks",
       "room_assignments", "rooms", "procedures", "professionals",
       "inventory_movements", "inventory_items", "insurances",
       "users", "tenants" CASCADE;`,
    );
  } catch {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "audit_logs"; DELETE FROM "notifications";
       DELETE FROM "installments"; DELETE FROM "financial_transactions";
       DELETE FROM "odontogram_teeth"; DELETE FROM "odontograms";
       DELETE FROM "treatment_plan_items"; DELETE FROM "treatment_plans";
       DELETE FROM "clinical_records"; DELETE FROM "appointments";
       DELETE FROM "patient_attachments"; DELETE FROM "patient_guardians";
       DELETE FROM "medical_histories"; DELETE FROM "patients";
       DELETE FROM "schedule_blocks"; DELETE FROM "room_assignments";
       DELETE FROM "rooms"; DELETE FROM "procedures";
       DELETE FROM "professionals"; DELETE FROM "inventory_movements";
       DELETE FROM "inventory_items"; DELETE FROM "insurances";
       DELETE FROM "users"; DELETE FROM "tenants";`,
    );
  }
}

export async function destroyTestApp() {
  if (app) {
    await app.close();
  }
}

import * as request from 'supertest';
