/**
 * Remotive — free public JSON API, 100% remote jobs, heavy on AI/ML startups.
 * Docs: https://remotive.com/api/remote-jobs
 * No auth required.
 */
import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
  company_logo: string;
}

export class RemotiveScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
      const params = new URLSearchParams({ limit: String(filters.limit ?? 100) });
      if (filters.role) params.set('search', filters.role);

      const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { logger.warn({ status: res.status }, 'Remotive API error'); return []; }

      const data = await res.json() as { jobs?: RemotiveJob[] };

      for (const item of data.jobs ?? []) {
        jobs.push({
          externalId:  String(item.id),
          source:      'custom' as const,
          company:     item.company_name,
          title:       item.title,
          location:    item.candidate_required_location || 'Worldwide',
          locationType: 'remote',
          description: item.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000) ?? item.title,
          applyUrl:    item.url,
          postedAt:    item.publication_date ? new Date(item.publication_date) : new Date(),
        });
      }

      logger.info(`Remotive: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Remotive scraper failed');
    }
    return jobs;
  }
}
