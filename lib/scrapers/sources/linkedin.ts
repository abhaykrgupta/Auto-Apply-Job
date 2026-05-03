import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class LinkedInScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      const params = new URLSearchParams();
      if (filters.role) params.set('keywords', filters.role);
      if (filters.location) params.set('location', filters.location);
      if (filters.remote === 'remote') params.set('f_WT', '2');
      params.set('f_TPR', 'r604800');
      params.set('position', '1');
      params.set('pageNum', '0');

      const searchUrl = `https://www.linkedin.com/jobs/search/?${params.toString()}`;
      logger.info(`LinkedIn search: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(3000);
      await this.scrollToBottom(page);

      const rawJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('.base-card, .jobs-search__results-list li');
        return Array.from(cards).map((card) => {
          const link = card.querySelector('a.base-card__full-link, a.result-card__full-card-link') as HTMLAnchorElement;
          const jobId = link?.href?.match(/jobs\/view\/(\d+)/)?.[1] || '';
          return {
            externalId: jobId,
            title: card.querySelector('.base-search-card__title, .result-card__title')?.textContent?.trim() || '',
            company: card.querySelector('.base-search-card__subtitle, .result-card__subtitle')?.textContent?.trim() || '',
            location: card.querySelector('.job-search-card__location, .result-card__location')?.textContent?.trim() || '',
            postedAt: (card.querySelector('time') as HTMLTimeElement)?.dateTime || null,
            applyUrl: jobId ? `https://www.linkedin.com/jobs/view/${jobId}` : '',
          };
        }).filter((j) => j.externalId && j.title);
      });

      for (const raw of rawJobs) {
        jobs.push({
          externalId: raw.externalId,
          source: 'linkedin',
          company: raw.company || 'Unknown',
          title: raw.title,
          location: raw.location,
          description: raw.title,
          applyUrl: raw.applyUrl,
          postedAt: raw.postedAt ? new Date(raw.postedAt) : new Date(),
        } as ScrapedJob);
      }

      logger.info(`LinkedIn: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'LinkedIn scraping failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }
}
