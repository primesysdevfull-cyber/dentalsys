import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  bootstrapTestApp,
  destroyTestApp,
  cleanupTestDatabase,
  getPrisma,
} from './test-setup';

describe('Patients (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;
  const createdPatientIds: string[] = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-e2e';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-e2e';
    process.env.JWT_EXPIRATION = '15m';
    process.env.JWT_REFRESH_EXPIRATION = '7d';
    process.env.TOTP_ISSUER = 'DentalSys-Test';

    app = await bootstrapTestApp();

    const suffix = Math.random().toString(36).substring(2, 8);
    const email = `patients+${suffix}@e2e.test`;

    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Dr. Pacientes Teste',
        email,
        password: 'SecureP@ss123',
        clinicName: 'Clínica Pacientes',
        cnpj: '11223344000156',
        phone: '(11) 95555-6666',
      })
      .expect(201);

    accessToken = regRes.body.accessToken;

    const profileRes = await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    tenantId = profileRes.body.tenant.id;
  }, 30000);

  afterAll(async () => {
    await cleanupTestDatabase();
    await destroyTestApp();
  }, 10000);

  describe('POST /api/v1/patients', () => {
    it('should create a patient', async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      const res = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Paciente Teste ${suffix}`,
          cpf: '12345678901',
          email: `paciente+${suffix}@e2e.test`,
          phone: '(11) 94444-3333',
          gender: 'MALE',
          birthDate: '1990-05-15',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(`Paciente Teste ${suffix}`);
      expect(res.body.cpf).toBe('12345678901');
      createdPatientIds.push(res.body.id);
    });

    it('should create a patient with medical history', async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      const res = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Paciente Com Historico ${suffix}`,
          phone: '(11) 93333-2222',
          gender: 'FEMALE',
          medicalHistory: {
            allergies: 'Penicilina',
            chronicDiseases: 'Hipertensão',
            currentMedications: 'Losartana 50mg',
          },
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.medicalHistory).toBeDefined();
      expect(res.body.medicalHistory.allergies).toBe('Penicilina');
      createdPatientIds.push(res.body.id);
    });
  });

  describe('GET /api/v1/patients', () => {
    beforeAll(async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      const patients = [
        { name: `Ana Listagem ${suffix}`, phone: '(11) 91111-1111' },
        { name: `Bruno Listagem ${suffix}`, phone: '(11) 92222-2222' },
        { name: `Carlos Listagem ${suffix}`, phone: '(11) 93333-3333' },
      ];

      for (const p of patients) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/patients')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(p)
          .expect(201);
        createdPatientIds.push(res.body.id);
      }
    });

    it('should list patients with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('should filter patients by search term', async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Zuleica Busca ${suffix}`,
          cpf: '98765432100',
        })
        .expect(201);
      createdPatientIds.push(createRes.body.id);

      const res = await request(app.getHttpServer())
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ search: 'Zuleica' })
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.data.some((p: any) => p.name.includes('Zuleica')),
      ).toBe(true);
    });
  });

  describe('GET /api/v1/patients/:id', () => {
    let patientId: string;

    beforeAll(async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      const res = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Paciente Detalhe ${suffix}`,
          cpf: '11122233344',
          email: `detalhe+${suffix}@e2e.test`,
          phone: '(11) 90000-1111',
          gender: 'FEMALE',
        })
        .expect(201);

      patientId = res.body.id;
      createdPatientIds.push(patientId);
    });

    it('should return patient details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(patientId);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('medicalHistory');
      expect(res.body).toHaveProperty('guardians');
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/patients/:id', () => {
    let patientId: string;

    beforeAll(async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      const res = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Paciente Update ${suffix}`,
          phone: '(11) 98888-9999',
        })
        .expect(201);

      patientId = res.body.id;
      createdPatientIds.push(patientId);
    });

    it('should update patient', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Paciente Update - Atualizado',
          phone: '(11) 97777-6666',
          email: 'updated@e2e.test',
        })
        .expect(200);

      expect(res.body.name).toBe('Paciente Update - Atualizado');
      expect(res.body.phone).toBe('(11) 97777-6666');
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/patients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Nao Existe' })
        .expect(404);
    });
  });

  describe('GET /api/v1/patients (unauthorized)', () => {
    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patients')
        .expect(401);
    });

    it('should reject with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patients')
        .set('Authorization', 'Bearer invalid.token.value')
        .expect(401);
    });
  });
});
