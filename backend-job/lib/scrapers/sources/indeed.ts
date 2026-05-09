import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class IndeedScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const params = new URLSearchParams();
      if (filters.role) params.set('q', filters.role);
      if (filters.location) params.set('l', filters.location);
      if (filters.remote === 'remote') params.set('remotejob', '1');
      params.set('sort', 'date');
      params.set('fromage', '7');

      const searchUrl = `https://www.indeed.com/jobs?${params.toString()}`;
      logger.info(`Indeed search: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(3000);

      // Handle CAPTCHA
      const hasCaptcha = await page.$('form[action*="captcha"]');
      if (hasCaptcha) {
        logger.warn('Indeed CAPTCHA detected');
        return [];
      }

      await this.scrollToBottom(page);

      const rawJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('.job_seen_beacon, .jobsearch-SerpJobCard, [data-testid="slider_container"]');
        return Array.from(cards).map((card) => {
          const titleEl = card.querySelector('[class*="jobTitle"] a, .jcs-JobTitle a');
          const companyEl = card.querySelector('[data-testid="company-name"], [class*="companyName"]');
          const locationEl = card.querySelector('[data-testid="text-location"], [class*="companyLocation"]');
          const salaryEl = card.querySelector('[class*="salary"], [class*="compensation"], [data-testid="attribute_snippet_testid"]');
          const snippetEl = card.querySelector('.job-snippet, [class*="jobSnippet"], [data-testid="jobsnippet_container"]');
          const href = (titleEl as HTMLAnchorElement)?.href || '';
          const jobKey = href.match(/jk=([^&]+)/)?.[1] || card.getAttribute('data-jk') || '';

          return {
            externalId: jobKey,
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || '',
            salary: salaryEl?.textContent?.trim() || '',
            description: snippetEl?.textContent?.trim() || '',
            applyUrl: jobKey ? `https://www.indeed.com/viewjob?jk=${jobKey}` : '',
          };
        }).filter((j) => j.externalId && j.title);
      });

      for (const raw of rawJobs) {
        let salaryMin: number | undefined;
        let salaryMax: number | undefined;
        if (raw.salary) {
          const m = raw.salary.match(/\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)/);
          if (m) {
            salaryMin = parseInt(m[1].replace(/,/g, ''));
            salaryMax = parseInt(m[2].replace(/,/g, ''));
          }
        }
        jobs.push({
          externalId: raw.externalId,
          source: 'indeed',
          company: raw.company || 'Unknown',
          title: raw.title,
          location: raw.location,
          description: raw.description || raw.title,
          applyUrl: raw.applyUrl,
          postedAt: new Date(),
          ...(salaryMin !== undefined && { salaryMin }),
          ...(salaryMax !== undefined && { salaryMax }),
        } as ScrapedJob);
      }

      logger.info(`Indeed: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Indeed scraping failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }
}
