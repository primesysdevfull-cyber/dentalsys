import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  bootstrapTestApp,
  destroyTestApp,
  cleanupTestDatabase,
  getPrisma,
} from './test-setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const unique = Math.random().toString(36).substring(2, 8);
  const testEmail = `auth+${unique}@e2e.test`;
  const testPassword = 'SecureP@ss123';
  const testCnpj = '12345678000190';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-e2e';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-e2e';
    process.env.JWT_EXPIRATION = '15m';
    process.env.JWT_REFRESH_EXPIRATION = '7d';
    process.env.TOTP_ISSUER = 'DentalSys-Test';

    app = await bootstrapTestApp();
  }, 30000);

  afterAll(async () => {
    await cleanupTestDatabase();
    await destroyTestApp();
  }, 10000);

  describe('POST /api/v1/auth/register', () => {
    it('should create a new tenant and admin user', async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Dr. Teste Admin',
          email: `register+${suffix}@e2e.test`,
          password: 'SecureP@ss123',
          clinicName: 'Clínica Teste E2E',
          cnpj: '11223344000155',
          phone: '(11) 98888-7777',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(`register+${suffix}@e2e.test`);
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Dr. Teste Admin',
          email: testEmail,
          password: testPassword,
          clinicName: 'Clínica Teste',
          cnpj: testCnpj,
          phone: '(11) 98888-6666',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Dr. Teste Admin 2',
          email: testEmail,
          password: testPassword,
          clinicName: 'Clínica Teste 2',
          cnpj: '99887766000155',
          phone: '(11) 98888-5555',
        })
        .expect(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let registeredEmail: string;
    let registeredPassword: string;

    beforeAll(async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      registeredEmail = `login+${suffix}@e2e.test`;
      registeredPassword = 'SecureP@ss123';

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Dr. Login Test',
          email: registeredEmail,
          password: registeredPassword,
          clinicName: 'Clínica Login',
          cnpj: '55667788000199',
          phone: '(11) 97777-8888',
        })
        .expect(201);
    });

    it('should return tokens with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: registeredEmail,
          password: registeredPassword,
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(0);
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: registeredEmail,
          password: 'WrongPassword@123',
        })
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@e2e.test',
          password: 'SomePassword@123',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeAll(async () => {
      const suffix = Math.random().toString(36).substring(2, 8);
      const email = `profile+${suffix}@e2e.test`;

      const regRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Dr. Profile Test',
          email,
          password: 'SecureP@ss123',
          clinicName: 'Clínica Profile',
          cnpj: '33445566000177',
          phone: '(11) 96666-7777',
        })
        .expect(201);

      accessToken = regRes.body.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('role');
      expect(res.body).toHaveProperty('tenant');
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('should reject with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
