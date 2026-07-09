const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createPatient = async (req, res) => {
  try {
    const { name, age, gender, phone } = req.body;
    const doctorId = req.doctor.id;

    if (!name || !age || !gender || !phone) {
      return res.status(400).json({ error: 'Name, age, gender, and phone are required.' });
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        age: parseInt(age, 10),
        gender,
        phone,
        doctorId
      }
    });

    return res.status(201).json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    return res.status(500).json({ error: 'Internal server error while creating patient.' });
  }
};

exports.getPatients = async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { search } = req.query;

    const whereClause = {
      doctorId
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching patients.' });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctor.id;

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId
      },
      include: {
        soapNotes: {
          orderBy: { createdAt: 'desc' }
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or unauthorized.' });
    }

    if (patient.soapNotes && Array.isArray(patient.soapNotes)) {
      patient.soapNotes = patient.soapNotes.map(note => {
        try {
          note.medications = typeof note.medications === 'string' ? JSON.parse(note.medications || '[]') : (note.medications || []);
        } catch (e) {
          note.medications = [];
        }
        try {
          note.flags = typeof note.flags === 'string' ? JSON.parse(note.flags || '[]') : (note.flags || []);
        } catch (e) {
          note.flags = [];
        }
        return note;
      });
    }

    if (patient.prescriptions && Array.isArray(patient.prescriptions)) {
      patient.prescriptions = patient.prescriptions.map(item => {
        try {
          item.medicines = typeof item.medicines === 'string' ? JSON.parse(item.medicines || '[]') : (item.medicines || []);
        } catch (e) {
          item.medicines = [];
        }
        return item;
      });
    }

    return res.status(200).json(patient);
  } catch (error) {
    console.error('Get patient details error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
