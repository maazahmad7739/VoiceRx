const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Helper to get the Gemini model configuration
 */
function getModel() {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured in the environment variables.');
  }
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });
}

/**
 * Returns the system instructions / prompt for the medical scribe
 */
const SYSTEM_INSTRUCTION = `You are an expert medical scribe assistant for Indian doctors. You understand Hinglish (Hindi-English mix) medical conversations. Your job is to convert a doctor's spoken notes about a patient into a perfectly structured clinical SOAP note.

Always:
- Extract only medically relevant information.
- Use standard medical terminology in the SOAP note.
- Write patient summary in simple language a non-doctor can understand.
- Flag any abnormal values, dangerous drug combinations, or important clinical alerts.
- If information for any SOAP section is not mentioned, write "Not documented".
- Never fabricate medical information not present in the input.

Return ONLY a valid JSON object matching the following structure:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "...",
  "patient_summary_english": "...",
  "patient_summary_hindi": "...",
  "icd_code": "most relevant ICD-10 code if identifiable, else null",
  "flags": ["..."],
  "medications_mentioned": ["..."],
  "follow_up_date": "YYYY-MM-DD format if mentioned, else null",
  "severity": "mild/moderate/severe/critical"
}`;

/**
 * Generate SOAP note from live text transcript
 * @param {string} transcriptText 
 * @param {string} summaryLanguage 'english' | 'hindi' | 'both'
 */
async function generateSoapNoteFromText(transcriptText, summaryLanguage) {
  const model = getModel();

  const prompt = `${SYSTEM_INSTRUCTION}

---
Doctor's spoken notes (Text): "${transcriptText}"
Output language preference for patient summary: "${summaryLanguage}"
Please ensure you populate the respective fields:
- If summaryLanguage is "english", write "Not requested" for patient_summary_hindi.
- If summaryLanguage is "hindi", write "Not requested" for patient_summary_english.
- If summaryLanguage is "both", provide both english and hindi summaries.

Return the exact JSON structure.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    const jsonResult = JSON.parse(responseText);
    // Add transcript back to results
    jsonResult.transcript = transcriptText;
    return jsonResult;
  } catch (error) {
    console.error('Failed to parse JSON response from Gemini API:', responseText);
    throw new Error('AI Response parsing error. Failed to format clinical note.');
  }
}

/**
 * Generate SOAP note from audio file directly
 * @param {Buffer} fileBuffer 
 * @param {string} mimeType 
 * @param {string} summaryLanguage 'english' | 'hindi' | 'both'
 */
async function generateSoapNoteFromAudio(fileBuffer, mimeType, summaryLanguage) {
  const model = getModel();

  // Convert buffer to base64 inline part
  const audioPart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType: mimeType
    }
  };

  const prompt = `${SYSTEM_INSTRUCTION}

---
Please transcribe the audio, then extract the clinical data.
Output language preference for patient summary: "${summaryLanguage}"
Please ensure you populate the respective fields:
- If summaryLanguage is "english", write "Not requested" for patient_summary_hindi.
- If summaryLanguage is "hindi", write "Not requested" for patient_summary_english.
- If summaryLanguage is "both", provide both english and hindi summaries.

Also, add a "transcript" property at the root of the JSON object containing the full verbatim transcription of the audio recording.

Return the exact JSON structure with the transcript included.`;

  const result = await model.generateContent([audioPart, prompt]);
  const responseText = result.response.text();

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse JSON response from Gemini API with Audio:', responseText);
    throw new Error('AI Response parsing error. Failed to format clinical note from audio.');
  }
}

module.exports = {
  generateSoapNoteFromText,
  generateSoapNoteFromAudio
};
