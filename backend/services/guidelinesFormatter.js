/**
 * Fetches guidelines from WHO public tags endpoint
 * @param {string} condition 
 * @returns {Promise<Array<Object>>} WHO guidelines list
 */
async function fetchWHOGuidelines(condition) {
  if (!condition) return [];
  
  const url = `https://www.who.int/api/news/newsitems?sf_culture=en&searchQuery=${encodeURIComponent(condition + ' guidelines')}&$top=3`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WHO search error: ${res.statusText}`);
    const data = await res.json();
    const items = data?.value || [];

    return items.map(item => {
      // Safely strip HTML tags from summary / details
      let details = item.Details || item.Summary || '';
      details = details.replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (details.length > 250) {
        details = details.substring(0, 250) + '...';
      }

      return {
        source: 'WHO',
        guideline_name: item.Title || 'WHO Clinical Guideline',
        year: item.PublishDate ? new Date(item.PublishDate).getFullYear().toString() : new Date().getFullYear().toString(),
        evidence_level: 'B', // default WHO recommendation level fallback
        recommendation: details,
        applies_to_this_patient: true,
        why: `WHO Guideline relating to ${condition}`,
        pubmed_id: null,
        link: item.Url ? `https://www.who.int${item.Url}` : 'https://www.who.int'
      };
    });
  } catch (error) {
    console.error('WHO API search failed:', error);
    return [];
  }
}

module.exports = {
  fetchWHOGuidelines
};
