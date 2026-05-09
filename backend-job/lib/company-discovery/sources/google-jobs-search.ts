import { logger } from '@/lib/utils/logger';

export interface DiscoveredCompany {
  name: string;
  websiteUrl: string;
  source: string;
}

export async function discoverViaGoogleJobs(role?: string, location?: string): Promise<DiscoveredCompany[]> {
  const serpapiKey = process.env.SERPAPI_KEY;
  const serperKey = process.env.SERPER_API_KEY;

  if (!serpapiKey && !serperKey) {
    logger.warn('Skipping Google Jobs discovery: SERPAPI_KEY and SERPER_API_KEY are missing');
    return [];
  }

  const query = `${role || 'software engineer'} ${location || 'remote'}`;
  logger.info({ query }, 'Searching Google Jobs for companies');

  try {
    if (serperKey) {
      return await searchSerperDev(query, serperKey);
    } else if (serpapiKey) {
      return await searchSerpApi(query, serpapiKey);
    }
  } catch (err) {
    logger.error({ err }, 'Google Jobs search failed');
  }

  return [];
}

async function searchSerperDev(query: string, apiKey: string): Promise<DiscoveredCompany[]> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ q: `${query} jobs career page`, num: 20 })
  });

  if (!response.ok) throw new Error(`Serper API error: ${response.status}`);
  const data = await response.json();

  const companies: DiscoveredCompany[] = [];
  
  if (data.organic) {
    for (const result of data.organic) {
      const url = result.link;
      // Skip known job boards
      if (url.includes('linkedin.com') || url.includes('indeed.com') || url.includes('glassdoor.com') || url.includes('builtin.com')) {
        continue;
      }

      // Try to extract company name from title
      const name = result.title.split('-')[0].split('|')[0].trim();
      if (name && url) {
        companies.push({ name, websiteUrl: url, source: 'google-jobs' });
      }
    }
  }
  return companies;
}

async function searchSerpApi(query: string, apiKey: string): Promise<DiscoveredCompany[]> {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.append('q', `${query} careers`);
  url.searchParams.append('api_key', apiKey);
  url.searchParams.append('num', '20');

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`SerpApi error: ${response.status}`);
  const data = await response.json();

  const companies: DiscoveredCompany[] = [];
  
  if (data.organic_results) {
    for (const result of data.organic_results) {
      const link = result.link;
      if (link.includes('linkedin.com') || link.includes('indeed.com') || link.includes('glassdoor.com')) {
        continue;
      }
      const name = result.title.split('-')[0].split('|')[0].trim();
      if (name && link) {
        companies.push({ name, websiteUrl: link, source: 'google-jobs' });
      }
    }
  }
  return companies;
}
