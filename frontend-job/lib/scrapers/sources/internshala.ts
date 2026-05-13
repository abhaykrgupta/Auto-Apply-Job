import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class IntershalaScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const role = (filters.role || 'software-developer').toLowerCase().replace(/\s+/g, '-');

    // Try fetch-based approach first (faster, no browser needed)
    try {
      jobs.push(...(await this.fetchJobs(role, filters)));
      if (jobs.length > 0) {
        logger.info(`Internshala fetch: found ${jobs.length} jobs`);
        return jobs;
      }
    } catch (err) {
      logger.warn({ err }, 'Internshala fetch approach failed, falling back to Playwright');
    }

    // Playwright fallback
    await this.setup();
    const page = await this.browser!.newPage();

    try {
      const url = `https://internshala.com/jobs/keywords-${encodeURIComponent(role)}/`;
      logger.info(`Internshala Playwright: ${url}`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(3000);
      await this.scrollToBottom(page);

      const rawJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll(
          '.individual_internship, .job_internship_card, [class*="job-internship-card"]'
        );
        return Array.from(cards).map((card) => {
          const titleEl = card.querySelector(
            '.job-internship-name, .profile, h3, [class*="job_title"], [class*="jobTitle"]'
          ) as HTMLAnchorElement | null;
          const companyEl = card.querySelector(
            '.company-name, [class*="company_name"], [class*="companyName"]'
          );
          const locationEl = card.querySelector(
            '.location-names, [class*="location"], .locations'
          );
          const linkEl = card.querySelector('a[href*="/jobs/detail"]') as HTMLAnchorElement | null;
          const idMatch = linkEl?.href?.match(/\/jobs\/detail\/([^/]+)/);
          const jobId = idMatch?.[1] || card.getAttribute('internship_id') || card.getAttribute('data-internship_id') || '';

          return {
            externalId: jobId,
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            location: locationEl?.textContent?.trim() || 'India',
            applyUrl: linkEl?.href || '',
          };
        }).filter((j) => j.title);
      });

      for (const raw of rawJobs) {
        jobs.push({
          externalId: raw.externalId || `internshala-${raw.title.replace(/\s+/g, '-').toLowerCase()}`,
          source: 'custom' as const,
          company: raw.company || 'Unknown',
          title: raw.title,
          location: raw.location || 'India',
          description: raw.title,
          applyUrl: raw.applyUrl || `https://internshala.com/jobs/keywords-${role}/`,
          postedAt: new Date(),
        });
      }

      logger.info(`Internshala Playwright: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Internshala Playwright scraping failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }

  private async fetchJobs(role: string, filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // Internshala AJAX endpoint used by their job listing pages
    const formData = new URLSearchParams();
    formData.set('keywords', filters.role || role);
    if (filters.location) formData.set('location', filters.location);

    const res = await fetch('https://internshala.com/jobs_ajax/recent_jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://internshala.com/jobs/keywords-${role}/`,
        'Origin': 'https://internshala.com',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Internshala API responded with ${res.status}`);

    const data = await res.json();

    // Response may be { internships_list: string } (HTML fragment) or an array
    const html: string = typeof data === 'string' ? data : (data.internships_list ?? data.jobs_list ?? '');
    if (!html) return jobs;

    // Parse job IDs and titles from the HTML fragment using regex (no DOM available server-side)
    const titleRe = /class="[^"]*(?:job-internship-name|profile)[^"]*"[^>]*>([^<]+)</g;
    const companyRe = /class="[^"]*company-name[^"]*"[^>]*>([^<]+)</g;
    const idRe = /internship_id["\s]*[:=]["\s]*(\d+)/g;
    const linkRe = /href="(\/jobs\/detail\/[^"]+)"/g;

    const titles: string[] = [];
    const companies: string[] = [];
    const ids: string[] = [];
    const links: string[] = [];

    let m: RegExpExecArray | null;
    while ((m = titleRe.exec(html)) !== null) titles.push(m[1].trim());
    while ((m = companyRe.exec(html)) !== null) companies.push(m[1].trim());
    while ((m = idRe.exec(html)) !== null) ids.push(m[1]);
    while ((m = linkRe.exec(html)) !== null) links.push(`https://internshala.com${m[1]}`);

    const count = Math.max(titles.length, ids.length);
    for (let i = 0; i < count; i++) {
      const title = titles[i] || '';
      if (!title) continue;
      jobs.push({
        externalId: ids[i] || `internshala-fetch-${i}-${Date.now()}`,
        source: 'custom' as const,
        company: companies[i] || 'Unknown',
        title,
        location: filters.location || 'India',
        description: title,
        applyUrl: links[i] || `https://internshala.com/jobs/keywords-${role}/`,
        postedAt: new Date(),
      });
    }

    return jobs;
  }
}
