import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

// Free API — no key needed for basic usage
// Docs: https://www.themuse.com/developers/api/v2
export class TheMuseScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      const params = new URLSearchParams({
        page: '1',
        descending: 'true',
      });

      if (filters.role) params.set('category', this.mapRoleToCategory(filters.role));
      if (filters.location && filters.remote !== 'remote') {
        params.set('location', filters.location);
      }
      if (filters.remote === 'remote') params.set('location', 'Flexible / Remote');

      // Optional API key for higher rate limits
      if (process.env.THEMUSE_API_KEY) params.set('api_key', process.env.THEMUSE_API_KEY);

      const url = `https://www.themuse.com/api/public/jobs?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'The Muse API error');
        return [];
      }

      const data = await res.json();
      const results: any[] = data.results ?? [];

      for (const item of results) {
        const applyUrl = item.refs?.landing_page ?? `https://www.themuse.com/jobs/${item.id}`;
        jobs.push({
          externalId: String(item.id),
          source: 'custom' as const,
          company: item.company?.name ?? 'Unknown',
          title: item.name,
          location: item.locations?.[0]?.name ?? 'Remote',
          locationType: item.locations?.some((l: any) => l.name?.toLowerCase().includes('remote')) ? 'remote' : undefined,
          description: item.contents ? item.contents.replace(/<[^>]+>/g, ' ').trim() : item.name,
          applyUrl,
          postedAt: item.publication_date ? new Date(item.publication_date) : new Date(),
        });
      }

      logger.info({ total: jobs.length }, 'The Muse scrape complete');
    } catch (err) {
      logger.error({ err }, 'The Muse fetch error');
    }

    return jobs;
  }

  private mapRoleToCategory(role: string): string {
    const r = role.toLowerCase();
    if (r.includes('engineer') || r.includes('developer') || r.includes('software')) return 'Engineering';
    if (r.includes('data') || r.includes('ml') || r.includes('ai')) return 'Data Science';
    if (r.includes('design')) return 'Design & UX';
    if (r.includes('product')) return 'Product';
    if (r.includes('market')) return 'Marketing & PR';
    if (r.includes('sales')) return 'Sales';
    return 'Engineering';
  }
}
