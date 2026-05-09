import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

// Free API: 10,000 requests/month
// Get keys at: https://developer.adzuna.com/
export class AdzunaScraper extends BaseScraper {
  private appId = process.env.ADZUNA_APP_ID ?? '';
  private appKey = process.env.ADZUNA_APP_KEY ?? '';

  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    if (!this.appId || !this.appKey) {
      logger.warn('Adzuna API keys not set (ADZUNA_APP_ID, ADZUNA_APP_KEY) — skipping');
      return [];
    }

    const jobs: ScrapedJob[] = [];
    const pages = 3; // 3 pages × 50 results = 150 jobs per call

    for (let page = 1; page <= pages; page++) {
      try {
        const params = new URLSearchParams({
          app_id: this.appId,
          app_key: this.appKey,
          results_per_page: '50',
          page: String(page),
          content_type: 'application/json',
          sort_by: 'date',
          max_days_old: '7',
        });

        if (filters.role) params.set('what', filters.role);
        if (filters.location) params.set('where', filters.location);
        if (filters.remote === 'remote') params.set('what_and', 'remote');

        // Use 'us' country — supports: us, gb, au, ca, de, fr, in, nz, pl, ru, sg, za
        const country = process.env.ADZUNA_COUNTRY ?? 'us';
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`;

        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) {
          logger.warn({ status: res.status }, 'Adzuna API error');
          break;
        }

        const data = await res.json();
        const results: any[] = data.results ?? [];

        for (const item of results) {
          jobs.push({
            externalId: item.id,
            source: 'custom' as const,
            company: item.company?.display_name ?? 'Unknown',
            title: item.title,
            location: item.location?.display_name ?? '',
            locationType: item.contract_type === 'permanent' ? undefined : undefined,
            description: item.description ?? item.title,
            applyUrl: item.redirect_url,
            postedAt: item.created ? new Date(item.created) : new Date(),
          });
        }

        logger.info({ page, count: results.length }, 'Adzuna page scraped');

        if (results.length < 50) break; // last page
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        logger.error({ err, page }, 'Adzuna fetch error');
        break;
      }
    }

    logger.info({ total: jobs.length }, 'Adzuna scrape complete');
    return jobs;
  }
}
