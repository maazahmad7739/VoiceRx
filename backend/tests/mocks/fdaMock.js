const mockFetch = jest.fn().mockImplementation(async (url) => {
  const urlString = String(url);

  // 1. Check openFDA API
  if (urlString.includes('api.fda.gov')) {
    if (urlString.includes('nonexistentdrug') || urlString.includes('unknownmed')) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: { message: 'No results found' } })
      };
    }

    // Default drug label with warnings referencing other drugs
    let drug_interactions = 'Do not take if you are taking lisinopril or amoxicillin.';
    let warnings = 'May cause drowsiness.';
    let warnings_and_precautions = 'Avoid in patients with severe kidney disease.';
    let contraindications = 'Contraindicated with sildenafil.';

    return {
      ok: true,
      status: 200,
      json: async () => ({
        results: [
          {
            drug_interactions: [drug_interactions],
            warnings: [warnings],
            warnings_and_precautions: [warnings_and_precautions],
            contraindications: [contraindications],
            openfda: {
              generic_name: ['aspirin'],
              brand_name: ['bayer aspirin']
            }
          }
        ]
      })
    };
  }

  // 2. Check PubMed Search API
  if (urlString.includes('esearch.fcgi')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        esearchresult: {
          idlist: ['321456', '789012']
        }
      })
    };
  }

  // 3. Check PubMed Fetch XML API
  if (urlString.includes('efetch.fcgi')) {
    const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
    <PubmedArticleSet>
      <PubmedArticle>
        <MedlineCitation>
          <PMID>321456</PMID>
          <Article>
            <ArticleTitle>Guideline for Hypertension Management in Adults</ArticleTitle>
            <Abstract>
              <AbstractText>We recommend ACE inhibitors as first line treatment for hypertension.</AbstractText>
            </Abstract>
          </Article>
        </MedlineCitation>
      </PubmedArticle>
      <PubmedArticle>
        <MedlineCitation>
          <PMID>789012</PMID>
          <Article>
            <ArticleTitle>Clinical Practice Guidelines for Diabetes Mellitus</ArticleTitle>
            <Abstract>
              <AbstractText>Metformin is the first-line pharmacotherapy for type 2 diabetes.</AbstractText>
            </Abstract>
          </Article>
        </MedlineCitation>
      </PubmedArticle>
    </PubmedArticleSet>`;

    return {
      ok: true,
      status: 200,
      text: async () => mockXml
    };
  }

  // 4. Check WHO Newsitems API
  if (urlString.includes('who.int/api')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        value: [
          {
            Title: 'WHO guideline on hypertension',
            Details: '<p>Standard pharmacological treatment guidelines for hypertension management.</p>',
            PublishDate: '2023-01-01T00:00:00Z',
            Url: '/news-room/hypertension-guidelines'
          }
        ]
      })
    };
  }

  // Fallback
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not Found' })
  };
});

module.exports = {
  mockFetch
};
