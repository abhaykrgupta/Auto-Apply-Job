/**
 * Workable public job board API.
 * Workable is the #1 ATS for Series A–B startups (50–500 employees).
 * Each company has a public endpoint at: https://{slug}.workable.com/api/v3/jobs
 *
 * For the global search use-case (all companies), we use the Workable
 * discovery endpoint which aggregates public boards.
 */
import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

interface WorkableJob {
  id: string;
  title: string;
  full_title: string;
  shortcode: string;
  code: string;
  state: string;
  department?: string;
  url: string;
  application_url: string;
  shortlink: string;
  location: {
    city: string;
    region: string;
    country: string;
    country_code: string;
    telecommuting: boolean;
    location_str: string;
  };
  created_at: string;
  description: string;
  requirements: string;
}

/**
 * Fetch jobs for a single Workable company board.
 * Called from ats-api-scraper Tier 0 when we detect a Workable ATS.
 */
export async function scrapeWorkableBoard(slug: string, companyName: string): Promise<ScrapedJob[]> {
  const res = await fetch(
    `https://apply.workable.com/api/v3/accounts/${slug}/jobs`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '', location: [], department: [], worktype: [], remote: [] }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!res.ok) throw new Error(`Workable API ${res.status}`);
  const data = await res.json() as { results?: WorkableJob[] };

  return (data.results ?? []).map((j) => ({
    externalId:  j.id,
    source:      'custom' as const,
    company:     companyName,
    title:       j.title,
    location:    j.location?.telecommuting ? 'Remote' : (j.location?.location_str ?? 'Unknown'),
    locationType: j.location?.telecommuting ? 'remote' : undefined,
    description: j.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000) ?? j.title,
    requirements: j.requirements?.replace(/<[^>]*>/g, ' ').trim().slice(0, 1000) ?? undefined,
    applyUrl:    j.application_url ?? j.shortlink,
    postedAt:    j.created_at ? new Date(j.created_at) : new Date(),
  }));
}

/** Broad scraper: pulls from Workable's public job discovery endpoint. */
export class WorkableScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
      const body: Record<string, unknown> = {
        query:    filters.role ?? '',
        location: filters.location && filters.remote !== 'remote' ? [filters.location] : [],
        remote:   filters.remote === 'remote' ? ['true'] : [],
        limit:    filters.limit ?? 50,
      };

      const res = await fetch('https://apply.workable.com/api/v3/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(12000),
      });

      if (!res.ok) { logger.warn({ status: res.status }, 'Workable API error'); return []; }

      const data = await res.json() as { results?: WorkableJob[] };

      for (const item of data.results ?? []) {
        jobs.push({
          externalId:  item.id,
          source:      'custom' as const,
          company:     item.full_title?.split(' - ').slice(-1)[0]?.trim() ?? 'Unknown',
          title:       item.title,
          location:    item.location?.telecommuting ? 'Remote' : (item.location?.location_str ?? 'Unknown'),
          locationType: item.location?.telecommuting ? 'remote' : undefined,
          description: item.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000) ?? item.title,
          applyUrl:    item.application_url ?? item.shortlink,
          postedAt:    item.created_at ? new Date(item.created_at) : new Date(),
        });
      }

      logger.info(`Workable: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Workable scraper failed');
    }
    return jobs;
  }
}
