/**
 * Y Combinator Jobs — covers 500+ YC portfolio companies.
 * Uses the public Algolia index that powers ycombinator.com/jobs.
 * No auth required.
 */
import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

// YC uses Algolia — these are the public app/index IDs
const ALGOLIA_APP  = 'K6ACI9CA29';
const ALGOLIA_INDEX = 'jobs';
const ALGOLIA_KEY  = '0b1d20b957917dbb63de89b6a3b4f4b3'; // public read-only search key

interface YCJob {
  objectID: string;
  title: string;
  company: string;
  remote: boolean;
  visa: boolean;
  locations: string[];
  description: string;
  url: string;
  created_at_i: number;
  batch?: string;
  tags?: string[];
}

interface AlgoliaResult {
  hits: YCJob[];
  nbHits: number;
}

export class YCJobsScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
      const body = {
        query:       filters.role ?? '',
        hitsPerPage: filters.limit ?? 100,
        filters:     filters.remote === 'remote' ? 'remote:true' : '',
      };

      const res = await fetch(
        `https://${ALGOLIA_APP}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type':          'application/json',
            'X-Algolia-Application-Id': ALGOLIA_APP,
            'X-Algolia-API-Key':        ALGOLIA_KEY,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!res.ok) {
        // Fallback: use the public YC jobs JSON feed
        return this.fallbackFetch(filters);
      }

      const data = await res.json() as AlgoliaResult;

      for (const item of data.hits ?? []) {
        const location = item.remote
          ? 'Remote'
          : item.locations?.[0] ?? 'Unknown';

        jobs.push({
          externalId:  item.objectID,
          source:      'custom' as const,
          company:     item.company,
          title:       item.title,
          location,
          locationType: item.remote ? 'remote' : undefined,
          description: item.description?.slice(0, 3000) ?? item.title,
          applyUrl:    item.url ?? `https://www.ycombinator.com/jobs`,
          postedAt:    item.created_at_i ? new Date(item.created_at_i * 1000) : new Date(),
        });
      }

      logger.info(`YC Jobs: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'YC Jobs scraper failed');
    }
    return jobs;
  }

  /** Fallback: scrape the public YC jobs JSON used by their own site */
  private async fallbackFetch(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
      const res = await fetch('https://www.ycombinator.com/jobs.json', {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];

      const data = await res.json() as YCJob[];
      const items = Array.isArray(data) ? data : [];

      for (const item of items) {
        if (filters.role) {
          const q = filters.role.toLowerCase();
          if (!item.title.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) continue;
        }

        jobs.push({
          externalId:  item.objectID ?? String(item.created_at_i),
          source:      'custom' as const,
          company:     item.company,
          title:       item.title,
          location:    item.remote ? 'Remote' : (item.locations?.[0] ?? 'Unknown'),
          locationType: item.remote ? 'remote' : undefined,
          description: item.description?.slice(0, 3000) ?? item.title,
          applyUrl:    item.url ?? `https://www.ycombinator.com/jobs`,
          postedAt:    item.created_at_i ? new Date(item.created_at_i * 1000) : new Date(),
        });
        if (jobs.length >= (filters.limit ?? 100)) break;
      }
    } catch { /* silent */ }
    return jobs;
  }
}
