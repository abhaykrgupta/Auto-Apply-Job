import { logger } from '@/lib/utils/logger';
import { type DiscoveredCompany } from './google-jobs-search';

export async function discoverViaProductHunt(): Promise<DiscoveredCompany[]> {
  logger.info('Fetching trending companies from ProductHunt');
  const companies: DiscoveredCompany[] = [];

  try {
    // We scrape the homepage HTML as it doesn't require auth (unlike the v2 API)
    const res = await fetch('https://www.producthunt.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) throw new Error(`ProductHunt returned ${res.status}`);
    const html = await res.text();

    // Naive HTML parsing: we look for outbound links or structured data
    // A better approach would be to parse __NEXT_DATA__ or use an HTML parser,
    // but for simplicity we extract obvious URL patterns.
    
    // Use regex to find potential company website links
    // Often found in data attributes or specific link classes
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (nextDataMatch) {
      const data = JSON.parse(nextDataMatch[1]);
      
      // Traverse the JSON tree (simplified logic)
      const extractPosts = (obj: any): any[] => {
        let results: any[] = [];
        if (!obj || typeof obj !== 'object') return results;
        if (obj.__typename === 'Post' && obj.name && obj.websiteUrl) {
          results.push(obj);
        }
        for (const key of Object.keys(obj)) {
          results.push(...extractPosts(obj[key]));
        }
        return results;
      };

      const posts = extractPosts(data);
      for (const post of posts) {
        if (post.name && post.websiteUrl) {
          companies.push({
            name: post.name,
            websiteUrl: post.websiteUrl,
            source: 'producthunt'
          });
        }
      }
    }

  } catch (err) {
    logger.error({ err }, 'Failed to fetch ProductHunt');
  }

  // Deduplicate
  const uniqueCompanies = Array.from(new Map(companies.map(c => [c.name, c])).values());
  return uniqueCompanies;
}
