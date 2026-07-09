process.env.GEMINI_API_KEY = 'mock-api-key-value';

jest.mock('@google/generative-ai', () => {
  return require('./mocks/geminiMock');
});

const { mockFetch } = require('./mocks/fdaMock');
global.fetch = mockFetch;

const { checkInteractions } = require('../services/drugInteractionService');
const { parseVoicePrescription } = require('../services/prescriptionParser');
const { searchGuidelines } = require('../services/pubmedService');
const { mockGenerateContent } = require('./mocks/geminiMock');

describe('Utility Services Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Drug Interaction Service (openFDA)', () => {
    it('should return empty list when 0 or 1 medications are provided', async () => {
      const resultEmpty = await checkInteractions([]);
      expect(resultEmpty).toEqual([]);

      const resultSingle = await checkInteractions(['Aspirin']);
      expect(resultSingle).toEqual([]);
    });

    it('should return interactions warning if drug FDA label references the other prescribed drug', async () => {
      // In fdaMock, any query to fda.gov (other than unknownmed/nonexistent) returns text mentioning 'lisinopril' or 'amoxicillin'
      const result = await checkInteractions(['Aspirin', 'Lisinopril']);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('drugA');
      expect(result[0]).toHaveProperty('drugB');
      expect(result[0].severity).toBe('high');
      expect(result[0].description).toContain('FDA drug label');
    });

    it('should handle openFDA API failures gracefully (return empty warnings and continue)', async () => {
      const result = await checkInteractions(['unknownmed', 'anotherunknownmed']);
      expect(result).toEqual([]);
    });
  });

  describe('Prescription Parser Service (Gemini)', () => {
    it('should parse voice text into structured json correctly using Gemini', async () => {
      const voiceText = 'Give paracetamol 500mg twice daily for 5 days after food. Diagnosis is viral fever.';
      const result = await parseVoicePrescription(voiceText);

      expect(result).toHaveProperty('medicines');
      expect(result.medicines[0].name).toBe('Paracetamol');
      expect(result.diagnosis).toContain('Viral Fever');
    });

    it('should throw error when Gemini API key is missing', async () => {
      // Temporarily remove API key from env
      const origApiKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      
      // Re-require the parser to test instantiation check
      jest.isolateModules(() => {
        const { parseVoicePrescription: isolatedParser } = require('../services/prescriptionParser');
        expect(isolatedParser('some voice text')).rejects.toThrow('GEMINI_API_KEY is not configured');
      });

      // Restore key
      process.env.GEMINI_API_KEY = origApiKey;
    });

    it('should handle Gemini JSON parsing failure and throw formatting error', async () => {
      // Set the mock to return invalid JSON
      mockGenerateContent.mockReturnValueOnce({
        response: {
          text: () => 'Invalid JSON string {not a json}'
        }
      });

      await expect(parseVoicePrescription('test query')).rejects.toThrow(
        'AI Prescription parsing error. Could not format medications list.'
      );
    });
  });

  describe('PubMed Guidelines Service', () => {
    it('should search and fetch guideline abstracts successfully', async () => {
      const result = await searchGuidelines('hypertension');
      
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('pubmed_id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('abstract');
      expect(result[0].pubmed_id).toBe('321456');
      expect(result[0].title).toBe('Guideline for Hypertension Management in Adults');
    });

    it('should return empty list when PubMed search returns no IDs', async () => {
      // Mock fetch once to return empty search result
      global.fetch = jest.fn().mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ esearchresult: { idlist: [] } })
      }));

      const result = await searchGuidelines('rare condition');
      expect(result).toEqual([]);
      
      // Restore standard mock fetch
      global.fetch = mockFetch;
    });
  });
});
