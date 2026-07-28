import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  bootstrapTestApp,
  destroyTestApp,
  cleanupTestDatabase,
  getPrisma,
} from './test-setup';

describe('Billing (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;
  let patientId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-e2e';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-e2e';
    process.env.JWT_EXPIRATION = '15m';
    process.env.JWT_REFRESH_EXPIRATION = '7d';
    process.env.TOTP_ISSUER = 'DentalSys-Test';

    app = await bootstrapTestApp();
    const prisma = getPrisma();

    const suffix = Math.random().toString(36).substring(2, 8);
    const email = `billing+${suffix}@e2e.test`;

    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Dr. Financeiro Teste',
        email,
        password: 'SecureP@ss123',
        clinicName: 'Clínica Financeira',
        cnpj: '33445566000178',
        phone: '(11) 92222-3333',
      })
      .expect(201);

    accessToken = regRes.body.accessToken;

    const profileRes = await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    tenantId = profileRes.body.tenant.id;

    const patientSuffix = Math.random().toString(36).substring(2, 8);
    const patientRes = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Paciente Financeiro ${patientSuffix}`,
        phone: '(11) 91111-2222',
      })
      .expect(201);

    patientId = patientRes.body.id;
  }, 30000);

  afterAll(async () => {
    await cleanupTestDatabase();
    await destroyTestApp();
  }, 10000);

  describe('POST /api/v1/billing', () => {
    it('should create an income transaction', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'INCOME',
          patientId,
          description: 'Consulta de rotina - limpeza',
          amount: 150.0,
          paymentMethod: 'PIX',
          dueDate: new Date().toISOString(),
          category: 'Consulta',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('INCOME');
      expect(res.body.description).toBe('Consulta de rotina - limpeza');
      expect(res.body.status).toBe('PENDING');
    });

    it('should create an expense transaction', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'EXPENSE',
          description: 'Compra de material odontológico',
          amount: 320.5,
          paymentMethod: 'CREDIT_CARD',
          dueDate: new Date().toISOString(),
          category: 'Material',
        })
        .expect(201);

      expect(res.body.type).toBe('EXPENSE');
      expect(res.body.description).toBe('Compra de material odontológico');
    });

    it('should create a transaction with installments', async () => {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);

      const res = await request(app.getHttpServer())
        .post('/api/v1/billing')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'INCOME',
          patientId,
          description: 'Tratamento de canal - parcelado',
          amount: 1200.0,
          paymentMethod: 'BOLETO',
          dueDate: dueDate.toISOString(),
          totalInstallments: 3,
          category: 'Tratamento',
        })
        .expect(201);

      expect(res.body).toHaveProperty('installments');
      expect(res.body.installments.length).toBe(3);
    });
  });

  describe('GET /api/v1/billing', () => {
    beforeAll(async () => {
      const transactions = [
        {
          type: 'INCOME',
          description: 'Limpeza dental',
          amount: 120.0,
          patientId,
        },
        {
          type: 'INCOME',
          description: 'Restauração',
          amount: 250.0,
          patientId,
        },
        {
          type: 'EXPENSE',
          description: 'Aluguel sala',
          amount: 3000.0,
        },
      ];

      for (const t of transactions) {
        await request(app.getHttpServer())
          .post('/api/v1/billing')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(t)
          .expect(201);
      }
    });

    it('should list transactions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/billing')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should list transactions with type filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/billing')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ type: 'EXPENSE' })
        .expect(200);

      expect(
        res.body.data.every((t: any) => t.type === 'EXPENSE'),
      ).toBe(true);
    });

    it('should list transactions with patient filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/billing')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ patientId })
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PATCH /api/v1/billing/:id/pay', () => {
    let transactionId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'INCOME',
          patientId,
          description: 'Consulta para pagar',
          amount: 200.0,
          paymentMethod: 'PIX',
        })
        .expect(201);

      transactionId = res.body.id;
    });

    it('should mark transaction as paid', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/billing/${transactionId}/pay`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentMethod: 'PIX' })
        .expect(200);

      expect(res.body.status).toBe('PAID');
      expect(res.body.paidAt).toBeDefined();
      expect(res.body.paymentMethod).toBe('PIX');
    });

    it('should reject paying already paid transaction', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/billing/${transactionId}/pay`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentMethod: 'PIX' })
        .expect(400);
    });

    it('should return 404 for non-existent transaction', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/billing/00000000-0000-0000-0000-000000000000/pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentMethod: 'PIX' })
        .expect(404);
    });
  });

  describe('GET /api/v1/billing/dashboard', () => {
    it('should return dashboard data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/billing/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('revenue');
      expect(res.body).toHaveProperty('expenses');
      expect(res.body).toHaveProperty('netProfit');
      expect(res.body).toHaveProperty('pendingAmount');
      expect(res.body).toHaveProperty('pendingCount');
      expect(res.body).toHaveProperty('overdueAmount');
      expect(res.body).toHaveProperty('overdueCount');
      expect(res.body).toHaveProperty('transactionCount');
      expect(typeof res.body.revenue).toBe('number');
      expect(typeof res.body.expenses).toBe('number');
      expect(typeof res.body.netProfit).toBe('number');
    });

    it('should return dashboard with date range', async () => {
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date();

      const res = await request(app.getHttpServer())
        .get('/api/v1/billing/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(res.body).toHaveProperty('revenue');
      expect(res.body).toHaveProperty('transactionCount');
    });
  });

  describe('Billing (unauthorized)', () => {
    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/billing')
        .expect(401);
    });

    it('should reject dashboard without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/billing/dashboard')
        .expect(401);
    });
  });
});
