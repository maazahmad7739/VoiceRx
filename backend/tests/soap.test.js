process.env.GEMINI_API_KEY = 'mock-api-key-value';

jest.mock('@google/generative-ai', () => {
  return require('./mocks/geminiMock');
});

const { mockFetch } = require('./mocks/fdaMock');
global.fetch = mockFetch;

const request = require('supertest');
const app = require('../server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('SOAP Note Controller Edge Cases', () => {
  let docToken = '';
  let docId = '';
  let otherDocToken = '';
  let patientId = '';
  let soapNoteId = '';

  const testDoctor = {
    name: 'SOAP Doc',
    specialization: 'Internal Medicine',
    clinic_name: 'SOAP Clinic',
    phone: '9999999801',
    email: 'testsoapdoc@example.com',
    password: 'password123'
  };

  const otherDoctor = {
    name: 'SOAP Other Doc',
    specialization: 'Neurology',
    clinic_name: 'Neuro Clinic',
    phone: '9999999802',
    email: 'testsoapotherdoc@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // Delete existing
    await prisma.sOAPNote.deleteMany({
      where: { doctor: { email: { in: [testDoctor.email, otherDoctor.email] } } }
    });
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

    // Create a patient under doctor 1
    const pRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${docToken}`)
      .send({
        name: 'SOAP Patient',
        age: 50,
        gender: 'Male',
        phone: '1231231234'
      });
    patientId = pRes.body.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.sOAPNote.deleteMany({
      where: { doctor: { email: { in: [testDoctor.email, otherDoctor.email] } } }
    });
    await prisma.patient.deleteMany({
      where: { doctor: { email: { in: [testDoctor.email, otherDoctor.email] } } }
    });
    await prisma.doctor.deleteMany({
      where: { email: { in: [testDoctor.email, otherDoctor.email] } }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/soap/generate-text', () => {
    it('should generate and save SOAP note with existing patient_id and transcript', async () => {
      const res = await request(app)
        .post('/api/soap/generate-text')
        .set('Authorization', `Bearer ${docToken}`)
        .send({
          patient_id: patientId,
          transcript: 'Patient has mild fever. prescribed paracetamol.',
          summary_lang: 'both'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('soapNote');
      expect(res.body).toHaveProperty('drugWarnings');
      expect(res.body.soapNote.patientId).toBe(patientId);
      expect(res.body.soapNote.subjective).not.toBe('Not documented');
      
      soapNoteId = res.body.soapNote.id;
    });

    it('should generate SOAP note and implicitly create a new patient when patient_details is provided', async () => {
      const res = await request(app)
        .post('/api/soap/generate-text')
        .set('Authorization', `Bearer ${docToken}`)
        .send({
          patient_details: {
            name: 'New SOAP Patient',
            age: 35,
            gender: 'Female',
            phone: '5556667777'
          },
          transcript: 'Patient needs diabetes management.',
          summary_lang: 'english'
        });

      expect(res.status).toBe(200);
      expect(res.body.soapNote.patient.name).toBe('New SOAP Patient');
      
      // Verify patient was indeed created in DB
      const patient = await prisma.patient.findUnique({
        where: { id: res.body.soapNote.patientId }
      });
      expect(patient).not.toBeNull();
    });

    it('should fail generation if transcript is missing', async () => {
      const res = await request(app)
        .post('/api/soap/generate-text')
        .set('Authorization', `Bearer ${docToken}`)
        .send({
          patient_id: patientId
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Transcript is required.');
    });

    it('should fail generation if both patient_id and patient_details are missing', async () => {
      const res = await request(app)
        .post('/api/soap/generate-text')
        .set('Authorization', `Bearer ${docToken}`)
        .send({
          transcript: 'A generic medical consult text.'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Please specify either patient_id or patient_details');
    });

    it('should fail generation if patient_id belongs to another doctor', async () => {
      const res = await request(app)
        .post('/api/soap/generate-text')
        .set('Authorization', `Bearer ${otherDocToken}`)
        .send({
          patient_id: patientId,
          transcript: 'Fever checkup.'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Patient not found or unauthorized.');
    });
  });

  describe('GET /api/history', () => {
    it('should retrieve doctor SOAP note history list', async () => {
      const res = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${docToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return empty list for doctor with no history', async () => {
      const res = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${otherDocToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/soap/:id', () => {
    it('should retrieve single SOAP note with fresh drug interaction check', async () => {
      const res = await request(app)
        .get(`/api/soap/${soapNoteId}`)
        .set('Authorization', `Bearer ${docToken}`);

      expect(res.status).toBe(200);
      expect(res.body.soapNote.id).toBe(soapNoteId);
      expect(res.body).toHaveProperty('drugWarnings');
    });

    it('should return 404 if SOAP note is not found or belongs to another doctor', async () => {
      const res = await request(app)
        .get(`/api/soap/${soapNoteId}`)
        .set('Authorization', `Bearer ${otherDocToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('SOAP note not found.');
    });
  });

  describe('PUT /api/soap/:id', () => {
    it('should update specific fields of the SOAP note', async () => {
      const res = await request(app)
        .put(`/api/soap/${soapNoteId}`)
        .set('Authorization', `Bearer ${docToken}`)
        .send({
          assessment: 'Updated assessment text',
          plan: 'Updated plan text'
        });

      expect(res.status).toBe(200);
      expect(res.body.assessment).toBe('Updated assessment text');
      expect(res.body.plan).toBe('Updated plan text');
    });

    it('should return 404/unauthorized if editing another doctor\'s SOAP note', async () => {
      const res = await request(app)
        .put(`/api/soap/${soapNoteId}`)
        .set('Authorization', `Bearer ${otherDocToken}`)
        .send({
          assessment: 'Malicious update attempt'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('SOAP note not found or unauthorized.');
    });
  });

  describe('GET /api/soap/stats/dashboard (Dashboard)', () => {
    it('should retrieve dashboard statistics for the doctor', async () => {
      const res = await request(app)
        .get('/api/soap/stats/dashboard')
        .set('Authorization', `Bearer ${docToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('patientsSeenTodayCount');
      expect(res.body).toHaveProperty('weeklySoapNotesCount');
      expect(res.body).toHaveProperty('recentNotes');
    });
  });
});
