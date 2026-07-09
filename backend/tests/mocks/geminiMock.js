const mockGenerateContent = jest.fn().mockImplementation((promptInput) => {
  // Extract string prompt from either promptInput or promptInput[1] (when audio base64 is passed first)
  let prompt = '';
  if (Array.isArray(promptInput)) {
    prompt = promptInput.find(p => typeof p === 'string') || '';
  } else if (typeof promptInput === 'string') {
    prompt = promptInput;
  }

  let textResult = '{}';

  if (prompt.includes('prescription parser') || prompt.includes(' spoken prescription')) {
    textResult = JSON.stringify({
      medicines: [
        {
          name: 'Paracetamol',
          dose: '500mg',
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'After food',
          quantity: 10
        },
        {
          name: 'Amoxicillin',
          dose: '250mg',
          frequency: 'Thrice daily',
          duration: '7 days',
          instructions: 'Before food',
          quantity: 21
        }
      ],
      diagnosis: 'Viral Fever with Suspected Bacterial Superinfection',
      special_instructions: 'Drink plenty of warm fluids and rest.',
      follow_up: '1 week'
    });
  } else if (prompt.includes('medical terminology extractor') || prompt.includes('Extract key clinical concepts')) {
    textResult = JSON.stringify({
      primary_condition: 'Essential Hypertension',
      secondary_conditions: ['Type 2 Diabetes mellitus'],
      key_search_terms: ['hypertension', 'diabetes', 'clinical guidelines'],
      pubmed_queries: [
        'hypertension guidelines 2023',
        'diabetes hypertension guidelines'
      ],
      relevant_guideline_bodies: ['AHA', 'ADA', 'ICMR'],
      urgency: 'routine',
      patient_risk_factors: ['Microalbuminuria']
    });
  } else if (prompt.includes('clinical consultant in India') || prompt.includes('second opinion on a complex case')) {
    textResult = JSON.stringify({
      direct_answer: 'Initiate an ACE inhibitor (e.g., Ramipril) and a SGLT2 inhibitor (e.g., Empagliflozin) for cardiorenal protection given the patient profile of hypertension, type 2 diabetes, and microalbuminuria.',
      guidelines_applied: [
        {
          source: 'ADA',
          guideline_name: 'Standards of Care in Diabetes',
          year: '2024',
          evidence_level: 'A',
          recommendation: 'SGLT2 inhibitors are recommended in patients with type 2 diabetes and chronic kidney disease.',
          applies_to_this_patient: true,
          why: 'The patient has type 2 diabetes and microalbuminuria.',
          pubmed_id: '38144211',
          link: 'https://diabetesjournals.org/care/article/47/Supplement_1/S1/153954'
        }
      ],
      what_guidelines_suggest: {
        first_line: 'ACE inhibitor or ARB maximum tolerated dose + SGLT2 inhibitor',
        second_line: 'Add Calcium Channel Blocker if BP target not achieved',
        what_to_avoid: ['Avoid combining ACE inhibitor and ARB due to hyperkalemia risk'],
        dose_considerations: 'Ramipril 5mg once daily; Empagliflozin 10mg once daily',
        monitoring: ['Serum creatinine', 'Potassium level', 'eGFR'],
        treatment_duration: 'Long-term/Lifelong maintenance',
        targets_to_achieve: ['BP < 130/80 mmHg', 'HbA1c < 7.0%']
      },
      red_flags: ['Creatinine increase > 30%', 'Severe hyperkalemia'],
      when_to_refer: 'Refer to Nephrologist if eGFR falls below 30',
      india_context: {
        preferred_drugs_in_india: ['Ramipril (generic)', 'Empagliflozin (generic)'],
        cost_consideration: 'Generics are highly cost-effective and widely available in Jan Aushadhi stores.',
        local_resistance_patterns: null,
        icmr_specific_note: 'ICMR guidelines align with ADA recommendations for renal protection.'
      },
      evidence_strength: 'strong',
      conflicting_guidelines: null,
      confidence: 'high',
      important_caveat: 'Monitor renal function closely during the first two weeks of initiating therapy.'
    });
  } else if (prompt.includes('expert medical scribe assistant') || prompt.includes('clinical SOAP note')) {
    textResult = JSON.stringify({
      subjective: 'Patient reports 3 days of high-grade fever, body aches, and mild dry cough.',
      objective: 'Temp 101.5 F, HR 92 bpm, Chest clear on auscultation.',
      assessment: 'Viral Fever with upper respiratory tract symptoms.',
      plan: 'Paracetamol 650mg as needed, warm water gargles, rest, follow up if fever persists beyond 5 days.',
      patient_summary_english: 'You have a viral fever. Rest and take paracetamol if you feel feverish or have body pain.',
      patient_summary_hindi: 'आपको वायरल बुखार है। आराम करें और बुखार या शरीर में दर्द होने पर पैरासिटामोल लें।',
      icd_code: 'A09',
      flags: ['High temperature'],
      medications_mentioned: ['Paracetamol'],
      follow_up_date: '2026-07-15',
      severity: 'mild'
    });
  }

  return {
    response: {
      text: () => textResult
    }
  };
});

const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent
});

class MockGoogleGenerativeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  getGenerativeModel = mockGetGenerativeModel;
}

module.exports = {
  GoogleGenerativeAI: MockGoogleGenerativeAI,
  mockGenerateContent,
  mockGetGenerativeModel
};
