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
    if (r.includes('engineer') || r.includes('developer') || r.includes('software') || r.includes('backend') || r.includes('frontend') || r.includes('fullstack') || r.includes('devops') || r.includes('sre') || r.includes('mobile') || r.includes('ios') || r.includes('android')) return 'Engineering';
    if (r.includes('data') || r.includes('ml') || r.includes('machine learning') || r.includes('ai') || r.includes('analyst') || r.includes('analytics') || r.includes('scientist')) return 'Data Science';
    if (r.includes('design') || r.includes('ux') || r.includes('ui') || r.includes('visual')) return 'Design & UX';
    if (r.includes('product manager') || r.includes('product owner') || r.includes('product lead')) return 'Product';
    if (r.includes('market') || r.includes('seo') || r.includes('content') || r.includes('brand') || r.includes('growth')) return 'Marketing & PR';
    if (r.includes('sales') || r.includes('account executive') || r.includes('business development') || r.includes('bdr') || r.includes('sdr')) return 'Sales';
    if (r.includes('finance') || r.includes('accounting') || r.includes('controller') || r.includes('cfo')) return 'Finance';
    if (r.includes('hr') || r.includes('recruit') || r.includes('people ops') || r.includes('talent')) return 'HR & Recruiting';
    if (r.includes('legal') || r.includes('counsel') || r.includes('compliance')) return 'Legal';
    if (r.includes('operations') || r.includes('ops') || r.includes('project manager') || r.includes('program manager')) return 'Operations';
    if (r.includes('customer success') || r.includes('customer support') || r.includes('support')) return 'Customer Service';
    if (r.includes('write') || r.includes('editor') || r.includes('copywriter') || r.includes('journalist')) return 'Writing & Editing';
    // Last resort: return Engineering only for clearly technical roles, else use broad category
    return 'Engineering';
  }
}
