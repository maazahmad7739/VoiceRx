const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const geminiService = require('../services/geminiService');
const drugInteractionService = require('../services/drugInteractionService');

const prisma = new PrismaClient();

function parseNote(note) {
  if (!note) return note;
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
}

function parseNotesArray(notes) {
  if (!notes || !Array.isArray(notes)) return [];
  return notes.map(note => parseNote(note));
}

// Configure Cloudinary if key exists
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
}

/**
 * Helper to upload audio buffer to Cloudinary or save locally
 */
async function handleAudioStorage(file) {
  if (!file) return null;

  if (process.env.CLOUDINARY_URL) {
    try {
      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video', // audio files are uploaded under video in Cloudinary
            folder: 'voicerx_audio',
            public_id: `audio_${Date.now()}`
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to local file storage.');
    }
  }

  // Local storage fallback
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileExt = path.extname(file.originalname) || '.wav';
  const fileName = `audio_${Date.now()}${fileExt}`;
  const filePath = path.join(uploadsDir, fileName);

  fs.writeFileSync(filePath, file.buffer);
  
  // Return relative path that can be served statically
  return `/uploads/${fileName}`;
}

/**
 * Helper to retrieve or create patient
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
 * Generate SOAP note from text transcript
 */
exports.generateSoapFromText = async (req, res) => {
  try {
    const { patient_id, patient_details, transcript, summary_lang } = req.body;
    const doctorId = req.doctor.id;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required.' });
    }

    const targetLang = summary_lang || 'both';

    // 1. Resolve Patient
    let patient;
    try {
      patient = await resolvePatient(doctorId, patient_id, patient_details);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // 2. Call Gemini Service
    const aiOutput = await geminiService.generateSoapNoteFromText(transcript, targetLang);

    // 3. Check drug interactions
    const drugWarnings = await drugInteractionService.checkInteractions(aiOutput.medications_mentioned || []);

    // 4. Save SOAP Note to DB
    let followUpDate = null;
    if (aiOutput.follow_up_date) {
      const dateParsed = new Date(aiOutput.follow_up_date);
      if (!isNaN(dateParsed.getTime())) {
        followUpDate = dateParsed;
      }
    }

    const soapNote = await prisma.sOAPNote.create({
      data: {
        doctorId,
        patientId: patient.id,
        transcript: aiOutput.transcript || transcript,
        subjective: aiOutput.subjective || 'Not documented',
        objective: aiOutput.objective || 'Not documented',
        assessment: aiOutput.assessment || 'Not documented',
        plan: aiOutput.plan || 'Not documented',
        patientSummaryEnglish: aiOutput.patient_summary_english || 'Not requested',
        patientSummaryHindi: aiOutput.patient_summary_hindi || 'Not requested',
        icdCode: aiOutput.icd_code || null,
        severity: aiOutput.severity || 'mild',
        medications: JSON.stringify(aiOutput.medications_mentioned || []),
        flags: JSON.stringify(aiOutput.flags || []),
        followUpDate
      },
      include: {
        patient: true
      }
    });

    return res.status(200).json({
      soapNote: parseNote(soapNote),
      drugWarnings
    });
  } catch (error) {
    console.error('Error generating SOAP from text:', error);
    return res.status(500).json({ error: error.message || 'AI SOAP generation failed.' });
  }
};

/**
 * Generate SOAP note from audio file
 */
exports.generateSoapFromAudio = async (req, res) => {
  try {
    const { patient_id, patient_details, summary_lang } = req.body;
    const doctorId = req.doctor.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Audio file is required.' });
    }

    const targetLang = summary_lang || 'both';

    // 1. Resolve Patient
    let patient;
    try {
      patient = await resolvePatient(doctorId, patient_id, patient_details);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // 2. Upload Audio File (Cloudinary or local)
    const audioUrl = await handleAudioStorage(file);

    // 3. Call Gemini Audio Service
    const aiOutput = await geminiService.generateSoapNoteFromAudio(file.buffer, file.mimetype, targetLang);

    // 4. Check drug interactions
    const drugWarnings = await drugInteractionService.checkInteractions(aiOutput.medications_mentioned || []);

    // 5. Save SOAP Note to DB
    let followUpDate = null;
    if (aiOutput.follow_up_date) {
      const dateParsed = new Date(aiOutput.follow_up_date);
      if (!isNaN(dateParsed.getTime())) {
        followUpDate = dateParsed;
      }
    }

    const soapNote = await prisma.sOAPNote.create({
      data: {
        doctorId,
        patientId: patient.id,
        transcript: aiOutput.transcript || 'Audio consultation',
        subjective: aiOutput.subjective || 'Not documented',
        objective: aiOutput.objective || 'Not documented',
        assessment: aiOutput.assessment || 'Not documented',
        plan: aiOutput.plan || 'Not documented',
        patientSummaryEnglish: aiOutput.patient_summary_english || 'Not requested',
        patientSummaryHindi: aiOutput.patient_summary_hindi || 'Not requested',
        icdCode: aiOutput.icd_code || null,
        severity: aiOutput.severity || 'mild',
        medications: JSON.stringify(aiOutput.medications_mentioned || []),
        flags: JSON.stringify(aiOutput.flags || []),
        audioUrl,
        followUpDate
      },
      include: {
        patient: true
      }
    });

    return res.status(200).json({
      soapNote: parseNote(soapNote),
      drugWarnings
    });
  } catch (error) {
    console.error('Error generating SOAP from audio:', error);
    return res.status(500).json({ error: error.message || 'AI SOAP generation from audio failed.' });
  }
};

/**
 * Get past SOAP notes history
 */
exports.getHistory = async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { search, date } = req.query;

    const whereClause = {
      doctorId
    };

    if (search) {
      whereClause.patient = {
        name: { contains: search }
      };
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    const soapNotes = await prisma.sOAPNote.findMany({
      where: whereClause,
      include: {
        patient: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(parseNotesArray(soapNotes));
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching history.' });
  }
};

/**
 * Get single SOAP note by ID
 */
exports.getSoapNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctor.id;

    const soapNote = await prisma.sOAPNote.findFirst({
      where: {
        id,
        doctorId
      },
      include: {
        patient: true
      }
    });

    if (!soapNote) {
      return res.status(404).json({ error: 'SOAP note not found.' });
    }

    const parsedNote = parseNote(soapNote);

    // Perform fresh drug interaction check if desired
    const drugWarnings = await drugInteractionService.checkInteractions(parsedNote.medications || []);

    return res.status(200).json({
      soapNote: parsedNote,
      drugWarnings
    });
  } catch (error) {
    console.error('Get SOAP note error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Get stats for dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const doctorId = req.doctor.id;

    // Get date boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Total patients seen today (distinct patients in SOAP notes today)
    const patientsToday = await prisma.sOAPNote.groupBy({
      by: ['patientId'],
      where: {
        doctorId,
        createdAt: { gte: todayStart }
      }
    });

    // SOAP notes generated this week
    const weeklySoapNotesCount = await prisma.sOAPNote.count({
      where: {
        doctorId,
        createdAt: { gte: oneWeekAgo }
      }
    });

    // Recent patient lists (patients seen recently)
    const recentNotes = await prisma.sOAPNote.findMany({
      where: { doctorId },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return res.status(200).json({
      patientsSeenTodayCount: patientsToday.length,
      weeklySoapNotesCount,
      recentNotes: parseNotesArray(recentNotes)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error fetching dashboard stats.' });
  }
};

/**
 * PUT /api/soap/:id
 * Updates specific fields on a SOAP note (e.g. appends assessments)
 */
exports.updateSoapNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { assessment, plan } = req.body;
    const doctorId = req.doctor.id;

    // Verify ownership
    const existing = await prisma.sOAPNote.findFirst({
      where: { id, doctorId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'SOAP note not found or unauthorized.' });
    }

    const updated = await prisma.sOAPNote.update({
      where: { id },
      data: {
        assessment: assessment !== undefined ? assessment : existing.assessment,
        plan: plan !== undefined ? plan : existing.plan
      },
      include: { patient: true }
    });

    return res.status(200).json(parseNote(updated));
  } catch (error) {
    console.error('Update SOAP note error:', error);
    return res.status(500).json({ error: 'Failed to update SOAP note.' });
  }
};
