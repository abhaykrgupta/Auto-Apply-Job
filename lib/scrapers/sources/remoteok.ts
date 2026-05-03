import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class RemoteOKScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      const response = await fetch('https://remoteok.com/api', {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });

      if (!response.ok) {
        logger.warn(`RemoteOK API returned ${response.status}`);
        return [];
      }

      const data: any[] = await response.json();
      const limit = filters.limit ?? 50;
      const items = data.slice(1, limit + 1); // first item is metadata

      for (const item of items) {
        if (!item.id || !item.position) continue;
        const roleMatch = filters.role
          ? item.position.toLowerCase().includes(filters.role.toLowerCase()) ||
            item.tags?.some((t: string) => t.toLowerCase().includes(filters.role!.toLowerCase()))
          : true;
        if (!roleMatch) continue;

        jobs.push({
          externalId: String(item.id),
          source: 'custom' as const,
          company: item.company || 'Unknown',
          title: item.position,
          location: 'Remote',
          locationType: 'remote',
          description: item.description || item.position,
          applyUrl: item.url || `https://remoteok.com/l/${item.slug}`,
          postedAt: item.date ? new Date(item.date) : new Date(),
        });
      }

      logger.info(`RemoteOK: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'RemoteOK scraping failed');
    }

    return jobs;
  }
}
