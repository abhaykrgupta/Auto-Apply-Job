import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class NaukriScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      const role = (filters.role || 'software-engineer').toLowerCase().replace(/\s+/g, '-');
      const location = filters.location ? `-in-${filters.location.toLowerCase().replace(/\s+/g, '-')}` : '';
      const url = `https://www.naukri.com/${role}-jobs${location}`;
      logger.info(`Naukri: ${url}`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(3000);

      const rawJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('.jobTuple, article.jobTuple');
        return Array.from(cards).map((card) => {
          const titleEl = card.querySelector('.title, .jobTitle') as HTMLAnchorElement;
          const companyEl = card.querySelector('.companyInfo .company, .companyName');
          const locationEl = card.querySelector('.location .ellipsis, [class*="location"]');
          const jobId = card.getAttribute('data-job-id') ||
                        titleEl?.href?.match(/(\d+)\.html/)?.[1] || '';
          return {
            externalId: jobId,
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || 'India',
            applyUrl: titleEl?.href || '',
          };
        }).filter((j) => j.externalId && j.title);
      });

      for (const raw of rawJobs) {
        jobs.push({
          externalId: raw.externalId,
          source: 'custom' as const,
          company: raw.company || 'Unknown',
          title: raw.title,
          location: raw.location,
          description: raw.title,
          applyUrl: raw.applyUrl || `https://www.naukri.com`,
          postedAt: new Date(),
        });
      }

      logger.info(`Naukri: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Naukri scraping failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }
}
