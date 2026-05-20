/**
 * Bayt.com Scraper
 *
 * The #1 job portal in the Middle East & North Africa (UAE, Saudi Arabia, Qatar, Kuwait).
 * Critical for Indian developers targeting Gulf opportunities — 40%+ of Gulf tech workforce is Indian.
 * 40,000+ active jobs at any time across UAE, KSA, Qatar, Bahrain, Kuwait, Oman.
 *
 * Approach: Playwright (Bayt uses JS rendering + anti-bot on their JSON API)
 * URL pattern: https://www.bayt.com/en/international/jobs/?q={role}&l={location}
 */

import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

// Gulf country codes supported on Bayt
const GULF_LOCATIONS: Record<string, string> = {
  uae:          'united-arab-emirates',
  dubai:        'dubai',
  abudhabi:     'abu-dhabi',
  saudi:        'saudi-arabia',
  riyadh:       'riyadh',
  qatar:        'qatar',
  doha:         'doha',
  kuwait:       'kuwait',
  bahrain:      'bahrain',
  oman:         'oman',
  muscat:       'muscat',
};

export class BaytScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      const role = encodeURIComponent(filters.role || 'software developer');
      const rawLocation = (filters.location ?? '').toLowerCase().replace(/\s+/g, '');
      const location = GULF_LOCATIONS[rawLocation] ?? 'united-arab-emirates';

      const url = `https://www.bayt.com/en/international/jobs/?q=${role}&l=${location}`;
      logger.info({ url }, '[Bayt] Navigating');

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(3000);

      // Dismiss cookie/consent modal if present
      await page.locator('button:has-text("Accept"), button:has-text("Got it"), [id*="cookie"] button').first().click().catch(() => {});
      await this.delay(1000);

      // Scroll to load more listings
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await this.delay(1500);
      }

      const rawJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('li[data-js-job], .has-pointer-d, [class*="job-card"]');
        const results: Array<{
          title: string; company: string; location: string;
          description: string; applyUrl: string; externalId: string;
          salary: string;
        }> = [];

        cards.forEach((card) => {
          const titleEl  = card.querySelector('h2 a, h3 a, .jb-title, [class*="title"] a') as HTMLAnchorElement | null;
          const compEl   = card.querySelector('[class*="company"], [data-company], .t-nowrap') as HTMLElement | null;
          const locEl    = card.querySelector('[class*="location"], [data-city], .jb-loc') as HTMLElement | null;
          const descEl   = card.querySelector('[class*="desc"], [class*="summary"], .jb-info') as HTMLElement | null;
          const salaryEl = card.querySelector('[class*="salary"], [class*="compensation"]') as HTMLElement | null;
          const linkEl   = card.querySelector('a[href*="/job/"]') as HTMLAnchorElement | null;

          const title   = titleEl?.textContent?.trim() ?? '';
          const company = compEl?.textContent?.trim() ?? '';
          const href    = titleEl?.href ?? linkEl?.href ?? '';

          if (!title || !href) return;

          const externalId = href.match(/\/job\/([^/?#]+)/)?.[1] ?? href;
          const applyUrl   = href.startsWith('http') ? href : `https://www.bayt.com${href}`;

          results.push({
            title,
            company,
            location:    locEl?.textContent?.trim() ?? '',
            description: descEl?.textContent?.trim() ?? '',
            applyUrl,
            externalId: `bayt-${externalId}`,
            salary:     salaryEl?.textContent?.trim() ?? '',
          });
        });

        return results;
      });

      for (const j of rawJobs) {
        if (!j.title || !j.applyUrl) continue;

        // Parse salary if present (e.g. "AED 8,000 – 12,000")
        let salaryMin: number | undefined;
        let salaryMax: number | undefined;
        if (j.salary) {
          const nums = j.salary.replace(/[^0-9,-]/g, '').split(/[-–]/);
          if (nums[0]) salaryMin = parseInt(nums[0].replace(',', ''), 10) || undefined;
          if (nums[1]) salaryMax = parseInt(nums[1].replace(',', ''), 10) || undefined;
        }

        jobs.push({
          externalId:  j.externalId,
          source:      'bayt',
          title:       j.title,
          company:     j.company || 'Unknown',
          location:    j.location || location,
          description: j.description,
          applyUrl:    j.applyUrl,
          salaryMin,
          salaryMax,
          postedAt:    new Date(),
        });
      }

      logger.info({ total: jobs.length }, '[Bayt] Done');
    } catch (err) {
      logger.error({ err }, '[Bayt] Scrape failed');
    } finally {
      await page.close().catch(() => {});
    }

    return jobs;
  }
}
