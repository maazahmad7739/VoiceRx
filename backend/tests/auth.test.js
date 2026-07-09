process.env.GEMINI_API_KEY = 'mock-api-key-value';

const request = require('supertest');
const app = require('../server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Auth Controller Edge Cases', () => {
  const testDoctor = {
    name: 'Test Doc',
    specialization: 'Cardiology',
    clinic_name: 'Test Heart Clinic',
    phone: '9999999999',
    email: 'testdoctor@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // Delete any existing test data to ensure clean state
    await prisma.doctor.deleteMany({
      where: { email: testDoctor.email }
    });
  });

  afterAll(async () => {
    // Cleanup test doctor
    await prisma.doctor.deleteMany({
      where: { email: testDoctor.email }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new doctor with valid details', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testDoctor);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.doctor).toHaveProperty('id');
      expect(res.body.doctor.email).toBe(testDoctor.email);
    });

    it('should fail registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testDoctor);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('already exists');
    });

    it('should fail registration with missing fields', async () => {
      const incompleteDoctor = { ...testDoctor, email: 'another@example.com' };
      delete incompleteDoctor.specialization; // Missing field

      const res = await request(app)
        .post('/api/auth/signup')
        .send(incompleteDoctor);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('All fields are required.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate doctor with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testDoctor.email,
          password: testDoctor.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.doctor.email).toBe(testDoctor.email);
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testDoctor.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials.');
    });

    it('should fail login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testDoctor.password
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials.');
    });

    it('should fail login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testDoctor.email
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and password are required.');
    });
  });

  describe('GET /api/auth/me', () => {
    let token = '';

    beforeAll(async () => {
      // Login to get a valid token
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testDoctor.email,
          password: testDoctor.password
        });
      token = res.body.token;
    });

    it('should retrieve doctor profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.doctor.email).toBe(testDoctor.email);
      expect(res.body.doctor.name).toBe(testDoctor.name);
    });

    it('should fail profile retrieval with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtokenhere');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token.');
    });

    it('should fail profile retrieval with no authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('Password Reset Flow', () => {
    let demoToken = '';

    it('should generate a password reset token for valid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testDoctor.email });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('demoToken');
      expect(res.body.message).toContain('generated successfully');
      demoToken = res.body.demoToken;
    });

    it('should fail to generate token for unregistered email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'notregistered@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('A doctor with this email could not be found.');
    });

    it('should fail to reset password with incorrect token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testDoctor.email,
          token: '000000', // Wrong token
          newPassword: 'newsecretpassword123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid reset token.');
    });

    it('should successfully reset password with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testDoctor.email,
          token: demoToken,
          newPassword: 'newsecretpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password has been reset successfully.');
    });

    it('should authenticate doctor with the new password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testDoctor.email,
          password: 'newsecretpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});
