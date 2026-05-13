/**
 * Jobicy — free remote jobs JSON API, strong startup & AI coverage.
 * Docs: https://jobicy.com/jobs-rss-feed  (also has JSON endpoint)
 * No auth required.
 */
import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryCurrency?: string;
}

export class JobicyScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
      const params = new URLSearchParams({ count: String(filters.limit ?? 50) });
      if (filters.role) params.set('q', filters.role);
      if (filters.location && filters.remote !== 'remote') params.set('geo', filters.location);

      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?${params}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { logger.warn({ status: res.status }, 'Jobicy API error'); return []; }

      const data = await res.json() as { jobs?: JobicyJob[] };

      for (const item of data.jobs ?? []) {
        jobs.push({
          externalId:  String(item.id),
          source:      'custom' as const,
          company:     item.companyName,
          title:       item.jobTitle,
          location:    item.jobGeo || 'Worldwide',
          locationType: 'remote',
          description: (item.jobDescription || item.jobExcerpt)
            ?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000) ?? item.jobTitle,
          applyUrl:    item.url,
          postedAt:    item.pubDate ? new Date(item.pubDate) : new Date(),
        });
      }

      logger.info(`Jobicy: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Jobicy scraper failed');
    }
    return jobs;
  }
}
