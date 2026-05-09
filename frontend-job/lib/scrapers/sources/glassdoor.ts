import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class GlassdoorScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      const keyword = encodeURIComponent(filters.role || 'software engineer');
      const url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${keyword}&sortBy=date_desc`;
      logger.info(`Glassdoor: ${url}`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(3000);
      await this.scrollToBottom(page);

      const rawJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-test="jobListing"], li.react-job-listing');
        return Array.from(cards).map((card) => {
          const link = card.querySelector('[data-test="job-link"], a[data-test="job-title"]') as HTMLAnchorElement;
          const jobId = link?.href?.match(/jobListingId=(\d+)/)?.[1] ||
                        card.getAttribute('data-id') || '';
          const salaryEl = card.querySelector('[data-test="detailSalary"]');
          return {
            externalId: jobId,
            title: link?.textContent?.trim() ||
                   card.querySelector('[data-test="job-title"]')?.textContent?.trim() || '',
            company: card.querySelector('[data-test="employer-name"]')?.textContent?.trim() || '',
            location: card.querySelector('[data-test="emp-location"]')?.textContent?.trim() || '',
            salary: salaryEl?.textContent?.trim() || '',
            applyUrl: jobId ? `https://www.glassdoor.com/job-listing/j?jobListingId=${jobId}` : '',
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
          applyUrl: raw.applyUrl,
          postedAt: new Date(),
        });
      }

      logger.info(`Glassdoor: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Glassdoor scraping failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }
}
