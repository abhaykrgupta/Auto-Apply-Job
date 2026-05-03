import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class WeWorkRemotelyScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      const category = filters.role?.includes('design') ? 'design' : 'programming';
      const url = `https://weworkremotely.com/categories/remote-${category}-jobs`;
      logger.info(`WeWorkRemotely: ${url}`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(2000);

      const rawJobs = await page.evaluate(() => {
        const items = document.querySelectorAll('section.jobs ul li:not(.view-all):not(.ad)');
        return Array.from(items).map((item) => {
          const link = item.querySelector('a') as HTMLAnchorElement;
          const href = link?.getAttribute('href') || '';
          const externalId = href.split('/').filter(Boolean).pop() || '';
          return {
            externalId,
            title: item.querySelector('.title')?.textContent?.trim() ||
                   item.querySelector('.new-listing-item__right h3')?.textContent?.trim() || '',
            company: item.querySelector('.company')?.textContent?.trim() ||
                     item.querySelector('.new-listing-item__right span')?.textContent?.trim() || '',
            region: item.querySelector('.region')?.textContent?.trim() || 'Remote',
            applyUrl: href.startsWith('http') ? href : `https://weworkremotely.com${href}`,
          };
        }).filter((j) => j.externalId && j.title);
      });

      for (const raw of rawJobs) {
        jobs.push({
          externalId: raw.externalId,
          source: 'custom' as const,
          company: raw.company || 'Unknown',
          title: raw.title,
          location: raw.region,
          locationType: 'remote',
          description: raw.title,
          applyUrl: raw.applyUrl,
          postedAt: new Date(),
        });
      }

      logger.info(`WeWorkRemotely: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'WeWorkRemotely scraping failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }
}
