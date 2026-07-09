const { PrismaClient } = require('@prisma/client');
const parserService = require('../services/prescriptionParser');

const prisma = new PrismaClient();

/**
 * Helper to parse a single prescription's medicines list
 */
function parsePrescription(prescription) {
  if (!prescription) return prescription;
  try {
    prescription.medicines = typeof prescription.medicines === 'string'
      ? JSON.parse(prescription.medicines || '[]')
      : (prescription.medicines || []);
  } catch (e) {
    prescription.medicines = [];
  }
  return prescription;
}

/**
 * Helper to parse an array of prescriptions
 */
function parsePrescriptionsArray(prescriptions) {
  if (!prescriptions || !Array.isArray(prescriptions)) return [];
  return prescriptions.map(item => parsePrescription(item));
}

/**
 * Helper to retrieve or create patient (mirrors SOAP note logic)
 */
async function resolvePatient(doctorId, patientId, patientDetailsJson) {
  if (patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, doctorId }
    });
    if (!patient) throw new Error('Patient not found or unauthorized.');
    return patient;
  }

  if (patientDetailsJson) {
    let details;
    try {
      details = typeof patientDetailsJson === 'string' ? JSON.parse(patientDetailsJson) : patientDetailsJson;
    } catch (e) {
      throw new Error('Invalid format for patient_details.');
    }

    const { name, age, gender, phone } = details;
    if (!name || !age || !gender || !phone) {
      throw new Error('Missing fields in patient_details (name, age, gender, phone required).');
    }

    // Create new patient
    return await prisma.patient.create({
      data: {
        name,
        age: parseInt(age, 10),
        gender,
        phone,
        doctorId
      }
    });
  }

  throw new Error('Please specify either patient_id or patient_details.');
}

/**
 * Endpoint to parse doctor's spoken voice prescription
 */
exports.parseVoice = async (req, res) => {
  try {
    const { voice_text } = req.body;
    if (!voice_text) {
      return res.status(400).json({ error: 'Voice transcript text is required.' });
    }

    const parsedJson = await parserService.parseVoicePrescription(voice_text);
    return res.status(200).json(parsedJson);
  } catch (error) {
    console.error('Prescription parser error:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse voice prescription.' });
  }
};

/**
 * Endpoint to save a new prescription record
 */
exports.createPrescription = async (req, res) => {
  try {
    const { 
      patient_id, 
      patient_details, 
      soap_note_id, 
      medicines, 
      diagnosis,
      special_instructions, 
      follow_up_date, 
      voice_input_text 
    } = req.body;
    const doctorId = req.doctor.id;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ error: 'Medicines list is required.' });
    }

    // 1. Resolve Patient
    let patient;
    try {
      patient = await resolvePatient(doctorId, patient_id, patient_details);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // 2. Parse Follow Up Date
    let followUpDate = null;
    if (follow_up_date) {
      const dateParsed = new Date(follow_up_date);
      if (!isNaN(dateParsed.getTime())) {
        followUpDate = dateParsed;
      }
    }

    // 3. Create database entry
    const prescription = await prisma.prescription.create({
      data: {
        doctorId,
        patientId: patient.id,
        soapNoteId: soap_note_id || null,
        medicines: JSON.stringify(medicines),
        diagnosis: diagnosis || null,
        specialInstructions: special_instructions || null,
        followUpDate,
        voiceInputText: voice_input_text || null
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    return res.status(201).json(parsePrescription(prescription));
  } catch (error) {
    console.error('Create prescription error:', error);
    return res.status(500).json({ error: 'Internal server error while saving prescription.' });
  }
};

/**
 * Get all prescriptions for a specific patient
 */
exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.doctor.id;

    const list = await prisma.prescription.findMany({
      where: {
        patientId,
        doctorId
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(parsePrescriptionsArray(list));
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve patient prescriptions.' });
  }
};

/**
 * Get single prescription by ID
 */
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctor.id;

    const item = await prisma.prescription.findFirst({
      where: {
        id,
        doctorId
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }

    return res.status(200).json(parsePrescription(item));
  } catch (error) {
    console.error('Get prescription by id error:', error);
    return res.status(500).json({ error: 'Failed to retrieve prescription.' });
  }
};
