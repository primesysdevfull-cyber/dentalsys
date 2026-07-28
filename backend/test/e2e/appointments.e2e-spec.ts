import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  bootstrapTestApp,
  destroyTestApp,
  cleanupTestDatabase,
  getPrisma,
} from './test-setup';

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;
  let patientId: string;
  let professionalId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-e2e';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-e2e';
    process.env.JWT_EXPIRATION = '15m';
    process.env.JWT_REFRESH_EXPIRATION = '7d';
    process.env.TOTP_ISSUER = 'DentalSys-Test';

    app = await bootstrapTestApp();
    const prisma = getPrisma();

    const suffix = Math.random().toString(36).substring(2, 8);
    const email = `appointments+${suffix}@e2e.test`;

    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Dr. Agendamentos Teste',
        email,
        password: 'SecureP@ss123',
        clinicName: 'Clínica Agendamentos',
        cnpj: '22334455000166',
        phone: '(11) 94444-5555',
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
        name: `Paciente Agendamento ${patientSuffix}`,
        phone: '(11) 93333-4444',
      })
      .expect(201);

    patientId = patientRes.body.id;

    const prof = await prisma.professional.create({
      data: {
        tenantId,
        name: `Dr. Profissional ${suffix}`,
        specialty: 'Odontologia Geral',
        color: '#FF5733',
      },
    });
    professionalId = prof.id;
  }, 30000);

  afterAll(async () => {
    await cleanupTestDatabase();
    await destroyTestApp();
  }, 10000);

  describe('POST /api/v1/appointments', () => {
    it('should create an appointment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          patientId,
          professionalId,
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
          source: 'PHONE',
          notes: 'Consulta de rotina',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('SCHEDULED');
      expect(res.body).toHaveProperty('patient');
      expect(res.body).toHaveProperty('professional');
    });

    it('should reject conflicting time', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(10, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setMinutes(endTime.getMinutes() + 30);

      await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          patientId,
          professionalId,
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
        })
        .expect(201);

      const conflictEnd = new Date(tomorrow);
      conflictEnd.setMinutes(conflictEnd.getMinutes() + 30);

      await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          patientId,
          professionalId,
          startTime: tomorrow.toISOString(),
          endTime: conflictEnd.toISOString(),
        })
        .expect(409);
    });

    it('should reject with end time before start time', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      tomorrow.setHours(14, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(13, 0, 0, 0);

      await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          patientId,
          professionalId,
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/appointments', () => {
    beforeAll(async () => {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 5);
      baseDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 3; i++) {
        const start = new Date(baseDate);
        start.setHours(8 + i, 0, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);

        await request(app.getHttpServer())
          .post('/api/v1/appointments')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            patientId,
            professionalId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          })
          .expect(201);
      }
    });

    it('should list appointments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should list appointments with date filter', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const res = await request(app.getHttpServer())
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /api/v1/appointments/:id/confirm', () => {
    let appointmentId: string;

    beforeAll(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      futureDate.setHours(15, 0, 0, 0);

      const end = new Date(futureDate);
      end.setMinutes(end.getMinutes() + 30);

      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          patientId,
          professionalId,
          startTime: futureDate.toISOString(),
          endTime: end.toISOString(),
        })
        .expect(201);

      appointmentId = res.body.id;
    });

    it('should confirm appointment', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.status).toBe('CONFIRMED');
      expect(res.body.confirmationSent).toBe(true);
    });

    it('should return 404 for non-existent appointment', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/appointments/00000000-0000-0000-0000-000000000000/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/appointments/:id/cancel', () => {
    let appointmentId: string;

    beforeAll(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 12);
      futureDate.setHours(11, 0, 0, 0);

      const end = new Date(futureDate);
      end.setMinutes(end.getMinutes() + 30);

      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          patientId,
          professionalId,
          startTime: futureDate.toISOString(),
          endTime: end.toISOString(),
        })
        .expect(201);

      appointmentId = res.body.id;
    });

    it('should cancel appointment', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reason: 'Paciente solicitou cancelamento' })
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
      expect(res.body.cancellationReason).toBe('Paciente solicitou cancelamento');
    });

    it('should return 404 for non-existent appointment', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/appointments/00000000-0000-0000-0000-000000000000/cancel')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Appointments (unauthorized)', () => {
    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/appointments')
        .expect(401);
    });
  });
});
