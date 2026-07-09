const xml2js = require('xml2js');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Searches PubMed for matching clinical guideline publications
 * @param {string} query 
 * @returns {Promise<Array<string>>} List of PubMed IDs
 */
async function searchPubMed(query) {
  const apiKey = process.env.NCBI_API_KEY;
  const apiKeyParam = apiKey ? `&api_key=${apiKey}` : '';
  const term = encodeURIComponent(`${query} guidelines[title]`);
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmax=5&retmode=json&sort=relevance${apiKeyParam}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PubMed search error: ${res.statusText}`);
    const data = await res.json();
    return data?.esearchresult?.idlist || [];
  } catch (error) {
    console.error('PubMed search failed:', error);
    return [];
  }
}

/**
 * Safely traverses the parsed xml2js object to extract abstract texts
 */
function extractAbstractText(abstractNode) {
  if (!abstractNode) return '';
  if (Array.isArray(abstractNode)) {
    return abstractNode
      .map(node => {
        if (typeof node === 'string') return node;
        if (typeof node === 'object' && node._) return node._;
        if (typeof node === 'object' && node.AbstractText) return extractAbstractText(node.AbstractText);
        return '';
      })
      .join(' ')
      .trim();
  }
  if (typeof abstractNode === 'object') {
    return abstractNode._ || '';
  }
  return String(abstractNode);
}

/**
 * Fetches abstracts for a list of PubMed IDs
 * @param {Array<string>} pmids 
 * @returns {Promise<Array<Object>>} Articles list
 */
async function fetchAbstracts(pmids) {
  if (!pmids || pmids.length === 0) return [];

  const apiKey = process.env.NCBI_API_KEY;
  const apiKeyParam = apiKey ? `&api_key=${apiKey}` : '';
  const pmidList = pmids.join(',');
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmidList}&retmode=xml&rettype=abstract${apiKeyParam}`;

  try {
    // 1. Fetch XML
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PubMed fetch error: ${res.statusText}`);
    const xmlText = await res.text();

    // 2. Parse XML
    const parsed = await xml2js.parseStringPromise(xmlText);
    const articles = [];
    const articleList = parsed?.PubmedArticleSet?.PubmedArticle || [];

    for (const article of articleList) {
      const medline = article?.MedlineCitation?.[0];
      const pmid = medline?.PMID?.[0]?._ || medline?.PMID?.[0] || '';
      
      const articleNode = medline?.Article?.[0];
      let title = articleNode?.ArticleTitle?.[0] || 'No Title';
      if (typeof title === 'object') {
        title = title._ || title.toString();
      }

      const abstractNode = articleNode?.Abstract?.[0]?.AbstractText;
      const abstractText = extractAbstractText(abstractNode) || 'No abstract available.';

      articles.push({
        pubmed_id: String(pmid),
        title: String(title),
        abstract: abstractText
      });
    }

    return articles;
  } catch (error) {
    console.error('PubMed fetch abstracts failed:', error);
    return [];
  }
}

/**
 * Main wrapper to search and fetch clinical abstracts
 * @param {string} query 
 * @returns {Promise<Array<Object>>}
 */
async function searchGuidelines(query) {
  const pmids = await searchPubMed(query);
  if (pmids.length === 0) return [];
  
  // Throttle to avoid 429 errors (delay 350ms before parallel abstract fetch)
  await sleep(350);
  return await fetchAbstracts(pmids);
}

module.exports = {
  searchGuidelines
};
