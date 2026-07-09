/**
 * Service to check drug interactions using the public OpenFDA API.
 * Since RxNav API was discontinued, we lookup the FDA labels for each drug
 * and search for cross-references to the other prescribed medications.
 */

/**
 * Checks for interactions among a list of medication names
 * @param {string[]} medications 
 * @returns {Promise<Array<{drugA: string, drugB: string, severity: string, description: string}>>}
 */
async function checkInteractions(medications) {
  if (!medications || !Array.isArray(medications) || medications.length <= 1) {
    return [];
  }

  const warnings = [];
  // Clean and normalize names
  const cleanMeds = medications
    .map(m => m.trim())
    .filter(m => m.length > 1);

  const normalizedMeds = cleanMeds.map(m => m.toLowerCase());

  for (let i = 0; i < cleanMeds.length; i++) {
    const currentMed = cleanMeds[i];
    const currentMedNorm = normalizedMeds[i];

    try {
      // Query OpenFDA API for the drug label (checks generic_name or brand_name)
      const query = `(openfda.generic_name:"${encodeURIComponent(currentMedNorm)}"+OR+openfda.brand_name:"${encodeURIComponent(currentMedNorm)}")`;
      const url = `https://api.fda.gov/drug/label.json?search=${query}&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        // If not found, skip to next drug
        continue;
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        continue;
      }

      const label = data.results[0];
      
      // Combine relevant warning and interaction text fields
      const interactionsText = [
        Array.isArray(label.drug_interactions) ? label.drug_interactions.join(' ') : label.drug_interactions,
        Array.isArray(label.warnings) ? label.warnings.join(' ') : label.warnings,
        Array.isArray(label.warnings_and_precautions) ? label.warnings_and_precautions.join(' ') : label.warnings_and_precautions,
        Array.isArray(label.contraindications) ? label.contraindications.join(' ') : label.contraindications
      ].filter(Boolean).join(' ').toLowerCase();

      // Check if any of the other drugs are mentioned in this drug's FDA label
      for (let j = 0; j < cleanMeds.length; j++) {
        if (i === j) continue;
        const otherMed = cleanMeds[j];
        const otherMedNorm = normalizedMeds[j];

        // Search for the drug name in the text
        if (interactionsText.includes(otherMedNorm)) {
          warnings.push({
            drugA: currentMed,
            drugB: otherMed,
            severity: 'high',
            description: `Potential warning found: The FDA drug label for ${currentMed} contains interaction warnings or contraindications related to ${otherMed}.`
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to retrieve OpenFDA interaction data for ${currentMed}:`, error.message);
    }
  }

  // De-duplicate warnings (A-B and B-A are same interaction)
  const uniqueWarnings = [];
  const seenPairs = new Set();

  for (const warning of warnings) {
    const pairKey = [warning.drugA.toLowerCase(), warning.drugB.toLowerCase()].sort().join('-');
    if (!seenPairs.has(pairKey)) {
      seenPairs.add(pairKey);
      uniqueWarnings.push(warning);
    }
  }

  return uniqueWarnings;
}

module.exports = {
  checkInteractions
};
