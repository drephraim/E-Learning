const axios = require('axios');

async function testOpenAlexSearch(topic) {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(topic)}&per-page=5`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'ELearningApp/1.0' }, timeout: 5000 });
    console.log(`OpenAlex Results for "${topic}": ${res.data.results?.length} papers found.`);
    res.data.results.forEach((paper, i) => {
      const title = paper.display_name;
      const year = paper.publication_year;
      const doi = paper.doi ? paper.doi.replace('https://doi.org/', '') : (paper.ids?.doi ? paper.ids.doi.replace('https://doi.org/', '') : `10.1000/openalex.${paper.id.split('/').pop()}`);
      const venue = paper.primary_location?.source?.display_name || paper.host_venue?.display_name || 'Academic Press / Journal';
      const authors = paper.authorships?.slice(0, 3).map(a => a.author.display_name).join(', ') || 'Academic Researchers';
      const citations = paper.cited_by_count || 0;
      console.log(`[${i+1}] "${title}" (${year}) by ${authors} | Venue: ${venue} | DOI: ${doi} | Citations: ${citations}`);
    });
  } catch (err) {
    console.error('OpenAlex query failed:', err.message);
  }
}

testOpenAlexSearch('Line Algorithms');
