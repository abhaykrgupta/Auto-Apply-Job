import { BaseScraper, type ScrapedJob, type JobFilters } from './base-scraper';
import { logger } from '@/lib/utils/logger';

export class LeverScraper extends BaseScraper {
  async scrapePage(boardUrl: string): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      await page.goto(boardUrl, { waitUntil: 'networkidle' });
      await this.delay();

      const company = new URL(boardUrl).pathname.split('/')[1] ?? 'Unknown';

      const rawJobs = await page.evaluate(() => {
        const postings = document.querySelectorAll('.posting');
        return Array.from(postings).map((el) => ({
          externalId: el.getAttribute('data-qa-posting-id') ?? undefined,
          title: el.querySelector('h5')?.textContent?.trim() ?? '',
          location: el.querySelector('.location')?.textContent?.trim() ?? '',
          applyUrl: (el.querySelector('a.posting-btn-submit') as HTMLAnchorElement)?.href ?? (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
        }));
      });

      for (const raw of rawJobs) {
        if (!raw.title || !raw.applyUrl) continue;
        jobs.push({
          ...raw,
          company,
          description: raw.title,
          source: 'lever',
        });
      }

      logger.info(`Lever: scraped ${jobs.length} jobs from ${boardUrl}`);
    } catch (err) {
      logger.error({ err }, 'Lever scrape failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    return [];
  }
}
