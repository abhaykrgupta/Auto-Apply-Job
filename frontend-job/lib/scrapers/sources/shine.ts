import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class ShineScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      const role = (filters.role || 'software-engineer')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const location = (filters.location || 'india')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const url = `https://www.shine.com/job-search/${role}-jobs-in-${location}`;
      logger.info(`Shine: ${url}`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(3000);

      // Dismiss any modal overlays
      await page.locator('[class*="modal"] button, button[aria-label*="close"]').first().click().catch(() => {});
      await this.delay(800);

      await this.scrollToBottom(page);

      const rawJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll(
          '.job-ads-details, .job-list-item, [class*="job-card"], [class*="jobCard"], li[data-job-id]'
        );
        return Array.from(cards).map((card) => {
          const titleEl = card.querySelector(
            '.job-title, [class*="job-title"], [class*="jobTitle"], h2 a, h3 a, a[title]'
          ) as HTMLAnchorElement | null;
          const companyEl = card.querySelector(
            '.company-name, [class*="company-name"], [class*="companyName"]'
          );
          const locationEl = card.querySelector(
            '[class*="location"], [class*="job-location"], .loc'
          );
          const jobId =
            card.getAttribute('data-job-id') ||
            card.getAttribute('data-id') ||
            titleEl?.href?.match(/\/(\d+)\/?(?:\?|$)/)?.[1] ||
            '';
          const applyUrl = (titleEl as HTMLAnchorElement)?.href || '';

          return {
            externalId: jobId,
            title: titleEl?.textContent?.trim() || (titleEl as HTMLAnchorElement)?.title?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || 'India',
            applyUrl,
          };
        }).filter((j) => j.title);
      });

      for (const raw of rawJobs) {
        jobs.push({
          externalId:
            raw.externalId ||
            `shine-${raw.company.replace(/\s+/g, '').toLowerCase()}-${raw.title.replace(/\s+/g, '').toLowerCase()}`,
          source: 'custom' as const,
          company: raw.company || 'Unknown',
          title: raw.title,
          location: raw.location || 'India',
          description: raw.title,
          applyUrl: raw.applyUrl || `https://www.shine.com/job-search/${role}-jobs-in-${location}`,
          postedAt: new Date(),
        });
      }

      logger.info(`Shine: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Shine scraping failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }
}
