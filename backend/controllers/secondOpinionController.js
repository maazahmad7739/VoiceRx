const { PrismaClient } = require('@prisma/client');
const pubmedService = require('../services/pubmedService');
const guidelinesFormatter = require('../services/guidelinesFormatter');
const geminiSecondOpinionService = require('../services/geminiSecondOpinionService');

const prisma = new PrismaClient();

/**
 * Utility to parse JSON fields on retrieval
 */
function parseSecondOpinion(item) {
  if (!item) return item;
  try {
    item.comorbidities = typeof item.comorbidities === 'string' ? JSON.parse(item.comorbidities || '[]') : item.comorbidities;
  } catch (e) { item.comorbidities = []; }
  try {
    item.currentMedications = typeof item.currentMedications === 'string' ? JSON.parse(item.currentMedications || '[]') : item.currentMedications;
  } catch (e) { item.currentMedications = []; }
  try {
    item.guidelinesApplied = typeof item.guidelinesApplied === 'string' ? JSON.parse(item.guidelinesApplied || '[]') : item.guidelinesApplied;
  } catch (e) { item.guidelinesApplied = []; }
  try {
    item.whatGuidelinesSuggest = typeof item.whatGuidelinesSuggest === 'string' ? JSON.parse(item.whatGuidelinesSuggest || '{}') : item.whatGuidelinesSuggest;
  } catch (e) { item.whatGuidelinesSuggest = {}; }
  try {
    item.indiaContext = typeof item.indiaContext === 'string' ? JSON.parse(item.indiaContext || '{}') : item.indiaContext;
  } catch (e) { item.indiaContext = {}; }
  try {
    item.geminiFullResponse = typeof item.geminiFullResponse === 'string' ? JSON.parse(item.geminiFullResponse || '{}') : item.geminiFullResponse;
  } catch (e) { item.geminiFullResponse = {}; }
  return item;
}

/**
 * Utility to parse list of second opinions
 */
function parseSecondOpinionsList(list) {
  if (!list || !Array.isArray(list)) return [];
  return list.map(item => parseSecondOpinion(item));
}

/**
 * POST /api/second-opinion/analyze
 * Generates live recommendations based on patient case
 */
exports.analyze = async (req, res) => {
  try {
    const {
      case_input,
      specific_question,
      patient_age,
      patient_gender,
      comorbidities,
      current_medications,
      allergies,
      duration
    } = req.body;

    if (!case_input || !specific_question) {
      return res.status(400).json({ error: 'Patient case text and specific question are required.' });
    }

    const age = patient_age ? parseInt(patient_age, 10) : null;
    const gender = patient_gender || 'unknown';
    const meds = Array.isArray(current_medications) ? current_medications : [];
    const conditionComorbidities = Array.isArray(comorbidities) ? comorbidities : [];

    const profile = {
      age,
      gender,
      comorbidities: conditionComorbidities,
      currentMedications: meds,
      allergies: Array.isArray(allergies) ? allergies : [],
      duration: duration || 'Not specified'
    };

    // Step 1: Extract concepts
    const concepts = await geminiSecondOpinionService.extractCaseConcepts(case_input, profile, specific_question);

    // Step 2: Fetch Guidelines (PubMed and WHO parallel searches)
    const [pubmedDocs, whoDocs] = await Promise.all([
      pubmedService.searchGuidelines(concepts.primary_condition),
      guidelinesFormatter.fetchWHOGuidelines(concepts.primary_condition)
    ]);

    // Format PubMed matches to guidelinesApplied items
    const formattedPubmed = pubmedDocs.map(doc => ({
      source: 'PubMed',
      guideline_name: doc.title,
      year: '2023', // default guideline reference placeholder
      evidence_level: 'B',
      recommendation: doc.abstract.slice(0, 300) + '...',
      applies_to_this_patient: true,
      why: 'Relevant scientific publication',
      pubmed_id: doc.pubmed_id,
      link: `https://pubmed.ncbi.nlm.nih.gov/${doc.pubmed_id}/`
    }));

    const retrievedGuidelines = [...formattedPubmed, ...whoDocs];

    // Step 3: Consult Gemini Pro clinical consultant
    const consultResponse = await geminiSecondOpinionService.generateSecondOpinionConsultation(
      case_input,
      profile,
      specific_question,
      retrievedGuidelines
    );

    // Merge PubMed/WHO guidelines found in backend to response
    // If Gemini added some guidelines applied, merge them
    const geminiMedsApplied = consultResponse.guidelines_applied || [];
    const finalGuidelines = [...retrievedGuidelines, ...geminiMedsApplied];

    // Deduplicate guidelines applied by link/name
    const seen = new Set();
    const dedupedGuidelines = [];
    for (const g of finalGuidelines) {
      const key = g.guideline_name + (g.link || '');
      if (!seen.has(key)) {
        seen.add(key);
        dedupedGuidelines.push(g);
      }
    }

    consultResponse.guidelines_applied = dedupedGuidelines;

    return res.status(200).json(consultResponse);
  } catch (error) {
    console.error('Analyze case error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze case second opinion.' });
  }
};

/**
 * POST /api/second-opinion/save-to-patient
 * Saves opinion consult to Patient record history
 */
exports.saveToPatient = async (req, res) => {
  try {
    const {
      patient_id,
      case_input,
      specific_question,
      patient_age,
      patient_gender,
      comorbidities,
      current_medications,
      analysis_result
    } = req.body;

    const doctorId = req.doctor.id;

    if (!case_input || !specific_question || !analysis_result) {
      return res.status(400).json({ error: 'Missing save parameters (case_input, question, result required).' });
    }

    const newOpinion = await prisma.secondOpinion.create({
      data: {
        doctorId,
        patientId: patient_id || null,
        caseInput: case_input,
        specificQuestion: specific_question,
        patientAge: patient_age ? parseInt(patient_age, 10) : null,
        patientGender: patient_gender || null,
        comorbidities: JSON.stringify(comorbidities || []),
        currentMedications: JSON.stringify(current_medications || []),
        directAnswer: analysis_result.direct_answer || '',
        guidelinesApplied: JSON.stringify(analysis_result.guidelines_applied || []),
        whatGuidelinesSuggest: JSON.stringify(analysis_result.what_guidelines_suggest || {}),
        indiaContext: JSON.stringify(analysis_result.india_context || {}),
        evidenceStrength: analysis_result.evidence_strength || 'moderate',
        geminiFullResponse: JSON.stringify(analysis_result)
      },
      include: {
        patient: true
      }
    });

    return res.status(201).json(parseSecondOpinion(newOpinion));
  } catch (error) {
    console.error('Save second opinion error:', error);
    return res.status(500).json({ error: 'Failed to save second opinion record.' });
  }
};

/**
 * GET /api/second-opinion/history
 * Fetch past second opinions list for doctor
 */
exports.getHistory = async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const history = await prisma.secondOpinion.findMany({
      where: { doctorId },
      include: { patient: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(parseSecondOpinionsList(history));
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ error: 'Failed to retrieve consult history.' });
  }
};

/**
 * GET /api/second-opinion/:id
 * Retrieve single opinion by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctor.id;

    const item = await prisma.secondOpinion.findFirst({
      where: { id, doctorId },
      include: { patient: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Second opinion record not found.' });
    }

    return res.status(200).json(parseSecondOpinion(item));
  } catch (error) {
    console.error('Get by id error:', error);
    return res.status(500).json({ error: 'Failed to retrieve second opinion.' });
  }
};
