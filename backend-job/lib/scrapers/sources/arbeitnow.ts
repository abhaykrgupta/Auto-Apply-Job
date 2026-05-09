import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

// Free API — no key needed, European + Remote jobs
// Docs: https://www.arbeitnow.com/api
export class ArbeitnowScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      const params = new URLSearchParams({ page: '1' });
      if (filters.role) params.set('q', filters.role);
      if (filters.location) params.set('location', filters.location);
      if (filters.remote === 'remote') params.set('remote', 'true');

      const url = `https://www.arbeitnow.com/api/job-board-api?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Arbeitnow API error');
        return [];
      }

      const data = await res.json();
      const results: any[] = data.data ?? [];

      for (const item of results) {
        jobs.push({
          externalId: item.slug,
          source: 'custom' as const,
          company: item.company_name ?? 'Unknown',
          title: item.title,
          location: item.location ?? (item.remote ? 'Remote' : 'Unknown'),
          locationType: item.remote ? 'remote' : undefined,
          description: item.description ? item.description.replace(/<[^>]+>/g, ' ').trim() : item.title,
          applyUrl: item.url,
          postedAt: item.created_at ? new Date(item.created_at * 1000) : new Date(),
        });
      }

      logger.info({ total: jobs.length }, 'Arbeitnow scrape complete');
    } catch (err) {
      logger.error({ err }, 'Arbeitnow fetch error');
    }

    return jobs;
  }
}
