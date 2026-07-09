process.env.GEMINI_API_KEY = 'mock-api-key-value';

const request = require('supertest');
const app = require('../server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Patient Controller Edge Cases', () => {
  let docToken = '';
  let docId = '';
  let otherDocToken = '';
  let otherDocId = '';
  let patientId = '';

  const testDoctor = {
    name: 'Patient Doc',
    specialization: 'General',
    clinic_name: 'General Clinic',
    phone: '9999999901',
    email: 'testpatientdoc@example.com',
    password: 'password123'
  };

  const otherDoctor = {
    name: 'Other Doc',
    specialization: 'Orthopedics',
    clinic_name: 'Ortho Clinic',
    phone: '9999999902',
    email: 'testotherdoc@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // Delete existing
    await prisma.patient.deleteMany({
      where: { doctor: { email: { in: [testDoctor.email, otherDoctor.email] } } }
    });
    await prisma.doctor.deleteMany({
      where: { email: { in: [testDoctor.email, otherDoctor.email] } }
    });

    // Create doctor 1
    let res = await request(app)
      .post('/api/auth/signup')
      .send(testDoctor);
    docToken = res.body.token;
    docId = res.body.doctor.id;

    // Create doctor 2
    res = await request(app)
      .post('/api/auth/signup')
      .send(otherDoctor);
    otherDocToken = res.body.token;
    otherDocId = res.body.doctor.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.patient.deleteMany({
      where: { doctor: { email: { in: [testDoctor.email, otherDoctor.email] } } }
    });
    await prisma.doctor.deleteMany({
      where: { email: { in: [testDoctor.email, otherDoctor.email] } }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/patients', () => {
    it('should return empty list when doctor has no patients', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${docToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/patients', () => {
    it('should create patient with valid details', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${docToken}`)
        .send({
          name: 'John Doe',
          age: 45,
          gender: 'Male',
          phone: '9876543210'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('John Doe');
      expect(res.body.doctorId).toBe(docId);
      patientId = res.body.id;
    });

    it('should fail creation with missing fields', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${docToken}`)
        .send({
          name: 'Jane Doe',
          age: 30
          // missing gender and phone
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name, age, gender, and phone are required.');
    });
  });

  describe('GET /api/patients (Filtering & Search)', () => {
    beforeAll(async () => {
      // Add one more patient
      await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${docToken}`)
        .send({
          name: 'Alice Smith',
          age: 28,
          gender: 'Female',
          phone: '1234567890'
        });
    });

    it('should retrieve both patients for doctor', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${docToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should filter patients by name search query', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${docToken}`)
        .query({ search: 'Alice' });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Alice Smith');
    });

    it('should filter patients by phone search query', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${docToken}`)
        .query({ search: '98765' });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('John Doe');
    });

    it('should return empty list if search query matches nothing', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${docToken}`)
        .query({ search: 'NonexistentName' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should return patient details for doctor who owns the patient record', async () => {
      const res = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${docToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(patientId);
      expect(res.body.name).toBe('John Doe');
    });

    it('should return 404/unauthorized if a different doctor tries to access this patient', async () => {
      const res = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${otherDocToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Patient not found or unauthorized.');
    });

    it('should return 404 if patient ID does not exist', async () => {
      const res = await request(app)
        .get('/api/patients/nonexistent-uuid-string')
        .set('Authorization', `Bearer ${docToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Patient not found or unauthorized.');
    });
  });
});
