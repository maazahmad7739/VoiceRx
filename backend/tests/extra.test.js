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

describe('Prescription and Second Opinion Controllers Edge Cases', () => {
  let docToken = '';
  let docId = '';
  let patientId = '';
  let prescriptionId = '';
  let secondOpinionId = '';
  
  const testDoctor = {
    name: 'Extra Doc',
    specialization: 'Endocrinology',
    clinic_name: 'Extra Clinic',
    phone: '9999999701',
    email: 'testextradoc@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // Delete existing
    await prisma.prescription.deleteMany({
      where: { doctor: { email: testDoctor.email } }
    });
    await prisma.secondOpinion.deleteMany({
      where: { doctor: { email: testDoctor.email } }
    });
    await prisma.patient.deleteMany({
      where: { doctor: { email: testDoctor.email } }
    });
    await prisma.doctor.deleteMany({
      where: { email: testDoctor.email }
    });

    // Create doctor
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testDoctor);
    docToken = res.body.token;
    docId = res.body.doctor.id;

    // Create patient
    const pRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${docToken}`)
      .send({
        name: 'Extra Patient',
        age: 60,
        gender: 'Male',
        phone: '1234445555'
      });
    patientId = pRes.body.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.prescription.deleteMany({
      where: { doctor: { email: testDoctor.email } }
    });
    await prisma.secondOpinion.deleteMany({
      where: { doctor: { email: testDoctor.email } }
    });
    await prisma.patient.deleteMany({
      where: { doctor: { email: testDoctor.email } }
    });
    await prisma.doctor.deleteMany({
      where: { email: testDoctor.email }
    });
    await prisma.$disconnect();
  });

  describe('Prescription Controller', () => {
    describe('POST /api/prescriptions/parse', () => {
      it('should parse voice text to prescription structured JSON', async () => {
        const res = await request(app)
          .post('/api/prescriptions/parse')
          .set('Authorization', `Bearer ${docToken}`)
          .send({ voice_text: 'Spoken prescription text' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('medicines');
        expect(res.body.medicines.length).toBeGreaterThan(0);
      });

      it('should fail voice parsing if voice_text is missing', async () => {
        const res = await request(app)
          .post('/api/prescriptions/parse')
          .set('Authorization', `Bearer ${docToken}`)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Voice transcript text is required.');
      });
    });

    describe('POST /api/prescriptions', () => {
      it('should create a new prescription record', async () => {
        const res = await request(app)
          .post('/api/prescriptions')
          .set('Authorization', `Bearer ${docToken}`)
          .send({
            patient_id: patientId,
            medicines: [
              { name: 'Metformin', dose: '500mg', frequency: 'Once daily', duration: '30 days' }
            ],
            diagnosis: 'Type 2 Diabetes',
            special_instructions: 'Take with dinner'
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.patientId).toBe(patientId);
        expect(res.body.medicines[0].name).toBe('Metformin');
        prescriptionId = res.body.id;
      });

      it('should fail creation if medicines list is missing or empty', async () => {
        const res = await request(app)
          .post('/api/prescriptions')
          .set('Authorization', `Bearer ${docToken}`)
          .send({
            patient_id: patientId,
            medicines: []
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Medicines list is required.');
      });
    });

    describe('GET /api/prescriptions/patient/:patientId', () => {
      it('should get prescriptions list for patient', async () => {
        const res = await request(app)
          .get(`/api/prescriptions/patient/${patientId}`)
          .set('Authorization', `Bearer ${docToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].id).toBe(prescriptionId);
      });
    });

    describe('GET /api/prescriptions/:id', () => {
      it('should get prescription details by ID', async () => {
        const res = await request(app)
          .get(`/api/prescriptions/${prescriptionId}`)
          .set('Authorization', `Bearer ${docToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(prescriptionId);
      });

      it('should return 404 for nonexistent prescription', async () => {
        const res = await request(app)
          .get('/api/prescriptions/nonexistent-id')
          .set('Authorization', `Bearer ${docToken}`);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Prescription not found.');
      });
    });
  });

  describe('Second Opinion Controller', () => {
    let mockResult = null;

    describe('POST /api/second-opinion/analyze', () => {
      it('should analyze case and generate opinion recommendations', async () => {
        const res = await request(app)
          .post('/api/second-opinion/analyze')
          .set('Authorization', `Bearer ${docToken}`)
          .send({
            case_input: 'Patient has high blood pressure and microalbuminuria.',
            specific_question: 'Should I initiate an ACE inhibitor or ARB?',
            patient_age: 60,
            patient_gender: 'Male',
            comorbidities: ['Diabetes'],
            current_medications: []
          });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('direct_answer');
        expect(res.body).toHaveProperty('guidelines_applied');
        expect(res.body).toHaveProperty('what_guidelines_suggest');
        
        mockResult = res.body;
      });

      it('should fail analyze if case_input or specific_question is missing', async () => {
        const res = await request(app)
          .post('/api/second-opinion/analyze')
          .set('Authorization', `Bearer ${docToken}`)
          .send({
            case_input: 'Patient has hypertension.'
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Patient case text and specific question are required.');
      });
    });

    describe('POST /api/second-opinion/save-to-patient', () => {
      it('should save second opinion report to patient record', async () => {
        const res = await request(app)
          .post('/api/second-opinion/save-to-patient')
          .set('Authorization', `Bearer ${docToken}`)
          .send({
            patient_id: patientId,
            case_input: 'Patient has high blood pressure and microalbuminuria.',
            specific_question: 'Should I initiate an ACE inhibitor or ARB?',
            patient_age: 60,
            patient_gender: 'Male',
            comorbidities: ['Diabetes'],
            current_medications: [],
            analysis_result: mockResult
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.patientId).toBe(patientId);
        secondOpinionId = res.body.id;
      });

      it('should fail save if key parameters are missing', async () => {
        const res = await request(app)
          .post('/api/second-opinion/save-to-patient')
          .set('Authorization', `Bearer ${docToken}`)
          .send({
            patient_id: patientId,
            case_input: 'Patient has hypertension.'
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Missing save parameters');
      });
    });

    describe('GET /api/second-opinion/history', () => {
      it('should get history of second opinions for doctor', async () => {
        const res = await request(app)
          .get('/api/second-opinion/history')
          .set('Authorization', `Bearer ${docToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].id).toBe(secondOpinionId);
      });
    });

    describe('GET /api/second-opinion/:id', () => {
      it('should get second opinion report details by ID', async () => {
        const res = await request(app)
          .get(`/api/second-opinion/${secondOpinionId}`)
          .set('Authorization', `Bearer ${docToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(secondOpinionId);
      });

      it('should return 404 for nonexistent second opinion ID', async () => {
        const res = await request(app)
          .get('/api/second-opinion/nonexistent-id')
          .set('Authorization', `Bearer ${docToken}`);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Second opinion record not found.');
      });
    });
  });
});
