import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class FounditScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      const role = encodeURIComponent(filters.role || 'software engineer');
      const location = encodeURIComponent(filters.location || 'India');
      const url = `https://www.foundit.in/search?query=${role}&location=${location}`;
      logger.info(`Foundit: ${url}`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(3000);

      // Handle any cookie consent / login prompts
      await page.locator('button[aria-label*="close"], button[aria-label*="Close"]').first().click().catch(() => {});
      await this.delay(1000);

      await this.scrollToBottom(page);

      const rawJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll(
          '.card-apply-content, .jobCard, [class*="job-card"], [class*="jobCard"], article[data-job-id]'
        );
        return Array.from(cards).map((card) => {
          const titleEl = card.querySelector(
            '.jobTitle, [class*="jobTitle"], [class*="job-title"], h2 a, h3 a'
          ) as HTMLAnchorElement | null;
          const companyEl = card.querySelector(
            '.companyName, [class*="companyName"], [class*="company-name"]'
          );
          const locationEl = card.querySelector(
            '[class*="location"], [class*="Location"]'
          );
          const jobId =
            card.getAttribute('data-job-id') ||
            card.getAttribute('data-id') ||
            titleEl?.href?.match(/\/(\d+)\/?(?:\?|$)/)?.[1] ||
            '';
          const applyUrl =
            (titleEl as HTMLAnchorElement)?.href ||
            (card.querySelector('a[href*="/job-detail"]') as HTMLAnchorElement)?.href ||
            '';

          return {
            externalId: jobId,
            title: titleEl?.textContent?.trim() || '',
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
            `foundit-${raw.company.replace(/\s+/g, '').toLowerCase()}-${raw.title.replace(/\s+/g, '').toLowerCase()}`,
          source: 'custom' as const,
          company: raw.company || 'Unknown',
          title: raw.title,
          location: raw.location || 'India',
          description: raw.title,
          applyUrl: raw.applyUrl || `https://www.foundit.in/search?query=${role}&location=${location}`,
          postedAt: new Date(),
        });
      }

      logger.info(`Foundit: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Foundit scraping failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }
}
