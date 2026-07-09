const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Parses spoken voice text into structured prescription JSON
 * @param {string} voiceText 
 * @returns {Promise<Object>}
 */
async function parseVoicePrescription(voiceText) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const prompt = `You are a medical prescription parser for Indian doctors. The doctor has spoken a prescription in English or Hinglish. Extract each medicine mentioned and return structured data.

Doctor's spoken prescription: "${voiceText}"

Return ONLY valid JSON:
{
  "medicines": [
    {
      "name": "medicine name",
      "dose": "dose with unit (e.g. 500mg, 10mg, 1 sachet, etc.)",
      "frequency": "Once daily/Twice daily/Thrice daily/Four times daily/SOS",
      "duration": "X days/weeks/months (e.g. 5 days, 1 week, etc.)",
      "instructions": "Before food/After food/Empty stomach/With milk/At bedtime",
      "quantity": "total tablets/capsules/units to dispense (calculate based on frequency and duration, e.g. Twice daily for 5 days = 10, Once daily for 3 days = 3)"
    }
  ],
  "diagnosis": "brief clinical diagnosis or symptoms/problems mentioned by the doctor (e.g. Viral Fever, Migraine, Type 2 Diabetes), else null",
  "special_instructions": "any general or special instructions mentioned, else null",
  "follow_up": "follow up duration if mentioned (e.g. 1 week, 3 days, etc.), else null"
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse Gemini prescription JSON:', responseText);
    throw new Error('AI Prescription parsing error. Could not format medications list.');
  }
}

module.exports = {
  parseVoicePrescription
};
