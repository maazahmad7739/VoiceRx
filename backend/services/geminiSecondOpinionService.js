const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Step 1: Extract search keywords and queries from patient case
 */
async function extractCaseConcepts(caseText, profile, specificQuestion) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const prompt = `You are an advanced medical terminology extractor. Analyze the doctor's patient case and return search keywords and PubMed queries.

Extract key clinical concepts from this doctor's case description to help search medical guidelines.

Case: "${caseText}"
Patient: ${profile.age || 'unknown'}yr ${profile.gender || 'unknown'}, Comorbidities: ${JSON.stringify(profile.comorbidities || [])}, Current medications: ${JSON.stringify(profile.currentMedications || [])}
Doctor's question: "${specificQuestion}"

Return ONLY valid JSON:
{
  "primary_condition": "main condition",
  "secondary_conditions": ["list of secondary conditions"],
  "key_search_terms": ["term1", "term2", "term3"],
  "pubmed_queries": [
    "primary condition guidelines year",
    "comorbidity management guidelines",
    "treatment guidelines for condition in profile"
  ],
  "relevant_guideline_bodies": ["WHO", "ICMR", "AHA", "ADA", "JNC"],
  "urgency": "routine/urgent/emergency",
  "patient_risk_factors": ["list of risk factors"]
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    return JSON.parse(responseText);
  } catch (err) {
    console.error('Failed to parse case concepts JSON:', responseText);
    // Return a default query object on error
    return {
      primary_condition: 'clinical case',
      secondary_conditions: [],
      key_search_terms: ['clinical guidelines'],
      pubmed_queries: ['clinical guidelines management'],
      relevant_guideline_bodies: ['WHO', 'ICMR'],
      urgency: 'routine',
      patient_risk_factors: []
    };
  }
}

/**
 * Step 2: Main consult prompt to generate the structured guidelines recommendation
 */
async function generateSecondOpinionConsultation(caseText, profile, specificQuestion, retrievedGuidelines) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  // Attempt to build model with Google Search grounding tools
  let model;
  try {
    model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      // Enable Google Search grounding (MIME type must be omitted to support tool grounding)
      tools: [{ googleSearch: {} }]
    });
  } catch (e) {
    console.warn('Google Search Grounding tool registration failed, falling back to standard gemini-2.5-flash:', e.message);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
  }

  const prompt = `You are a senior clinical consultant in India with 20 years experience. A doctor has come to you for a second opinion on a complex case. You have access to the latest clinical guidelines. Your job is to tell the doctor EXACTLY what the guidelines would recommend for THIS SPECIFIC PATIENT — not generic advice, but patient-specific guideline interpretation.

Note: You have real-time Google Search grounding enabled. If the guidelines in the provided "GUIDELINES RETRIEVED" section do not contain the answer, you MUST use Google Search to find and cite the latest clinical guidelines (e.g., from WHO, ICMR, ADA, AHA, ESC) that answer the doctor's specific question.

IMPORTANT: Summarize and paraphrase clinical guidelines in your own words. Do NOT quote guideline texts or publications verbatim, as this will trigger copyright/recitation filters. Ensure all recommendations are presented in a concise, original clinical consulting tone.

CRITICAL RULE: If neither the retrieved guidelines nor your Google Search grounding results contain the answer to the doctor's specific question, you MUST state "No specific guideline found for this exact query" in the \`direct_answer\`. Do NOT invent or hallucinate clinical guidelines.

PATIENT CASE:
${caseText}

PATIENT PROFILE:
Age: ${profile.age || 'N/A'}
Gender: ${profile.gender || 'N/A'}  
Comorbidities: ${JSON.stringify(profile.comorbidities || [])}
Current medications: ${JSON.stringify(profile.currentMedications || [])}
Known allergies: ${JSON.stringify(profile.allergies || [])}
Duration of current condition: ${profile.duration || 'Not specified'}

DOCTOR'S SPECIFIC QUESTION:
${specificQuestion}

GUIDELINES RETRIEVED:
${JSON.stringify(retrievedGuidelines)}

Now answer the doctor's question by doing this:
1. Identify the 2-3 most relevant guidelines for this exact case (cross reference with search grounding for ICMR, AHA, ADA etc.)
2. Extract the specific recommendations that apply to THIS patient given their age, gender, comorbidities, and current medications
3. Answer the doctor's specific question directly — be clear and decisive
4. Note any special considerations that change the standard recommendation for this patient
5. Flag any contraindications given this patient's specific profile
6. Give India-specific context — drug availability, cost, local treatment patterns, and ICMR notes
7. Note where evidence is strong vs weak
8. State clearly if guidelines conflict with each other

Return ONLY valid JSON:
{
  "direct_answer": "Direct answer to the doctor's specific question in 2-3 sentences. Most important output. Be decisive.",
  "guidelines_applied": [
    {
      "source": "WHO/ICMR/AHA/ADA/etc",
      "guideline_name": "full name of guideline",
      "year": "publication year",
      "evidence_level": "A/B/C",
      "recommendation": "exact relevant recommendation text",
      "applies_to_this_patient": true,
      "why": "why this applies or does not apply to THIS patient specifically",
      "pubmed_id": "pmid if from pubmed else null",
      "link": "url link if available, else null"
    }
  ],
  "what_guidelines_suggest": {
    "first_line": "what to do first according to guidelines for this patient",
    "second_line": "if first line fails or is contraindicated",
    "what_to_avoid": ["drug or treatment + reason why for THIS patient"],
    "dose_considerations": "any dose adjustments needed for this patient's profile",
    "monitoring": ["what to monitor", "how often"],
    "treatment_duration": "how long to treat",
    "targets_to_achieve": ["BP target", "HbA1c target", etc — whatever is relevant]
  },
  "red_flags": ["symptoms or findings that would immediately change management"],
  "when_to_refer": "if specialist needed, who and when, else null",
  "india_context": {
    "preferred_drugs_in_india": ["available and affordable options"],
    "cost_consideration": "cheap vs expensive options from guidelines",
    "local_resistance_patterns": "if antibiotics involved, else null",
    "icmr_specific_note": "if ICMR guideline differs from international, else null"
  },
  "evidence_strength": "strong/moderate/weak/conflicting",
  "conflicting_guidelines": "if guidelines disagree on anything, explain clearly, else null",
  "confidence": "high/medium/low",
  "important_caveat": "one sentence about limitations of this recommendation for this case"
}`;

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    console.warn('First opinion generation failed or recitation blocked. Retrying with sanitized prompt without abstracts...', err.message);
    
    // Sanitize retrieved guidelines by removing abstract bodies to avoid copyright/recitation checks
    const sanitizedGuidelines = Array.isArray(retrievedGuidelines) 
      ? retrievedGuidelines.map(g => ({
          source: g.source,
          guideline_name: g.guideline_name,
          year: g.year,
          evidence_level: g.evidence_level,
          recommendation: (g.recommendation || '').substring(0, 100) + '...',
          pubmed_id: g.pubmed_id,
          link: g.link
        }))
      : [];

    const fallbackPrompt = prompt.replace(
      JSON.stringify(retrievedGuidelines),
      JSON.stringify(sanitizedGuidelines)
    );

    const fallbackModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
    result = await fallbackModel.generateContent(fallbackPrompt);
  }

  const responseText = result.response.text();
  try {
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse second opinion consult JSON:', responseText);
    throw new Error('AI clinical consultation parsing error. Could not format guideline outputs.');
  }
}

module.exports = {
  extractCaseConcepts,
  generateSecondOpinionConsultation
};
