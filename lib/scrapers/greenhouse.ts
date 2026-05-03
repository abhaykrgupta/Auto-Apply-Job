import { BaseScraper, type ScrapedJob, type JobFilters } from './base-scraper';
import { logger } from '@/lib/utils/logger';

export class GreenhouseScraper extends BaseScraper {
  async scrapePage(boardUrl: string): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      await page.goto(boardUrl, { waitUntil: 'networkidle' });
      await this.delay();

      const company = new URL(boardUrl).pathname.split('/')[2] ?? 'Unknown';

      const rawJobs = await page.evaluate(() => {
        const elements = document.querySelectorAll('.opening');
        return Array.from(elements).map((el) => ({
          externalId: el.getAttribute('data-id') ?? undefined,
          title: el.querySelector('.opening-title')?.textContent?.trim() ?? '',
          location: el.querySelector('.location')?.textContent?.trim() ?? '',
          applyUrl: (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
        }));
      });

      for (const raw of rawJobs) {
        if (!raw.title || !raw.applyUrl) continue;
        jobs.push({
          ...raw,
          company,
          description: raw.title,
          source: 'greenhouse',
        });
      }

      logger.info(`Greenhouse: scraped ${jobs.length} jobs from ${boardUrl}`);
    } catch (err) {
      logger.error({ err }, 'Greenhouse scrape failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    // Greenhouse doesn't have a global search; scrape known boards
    return [];
  }
}
