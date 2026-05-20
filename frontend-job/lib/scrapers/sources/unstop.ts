/**
 * Unstop.com Scraper (formerly Dare2Compete)
 *
 * India's largest platform for campus hiring, hackathons, and fresher jobs.
 * Used by 200k+ companies including Google, Microsoft, Amazon, Deloitte, TCS, Infosys.
 * Especially strong for: entry-level, fresher, campus, and early-career roles.
 *
 * API: POST https://unstop.com/api/public/opportunity/search-new
 * No auth required. Returns paginated job listings as JSON.
 */

import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

interface UnstopOpportunity {
  id:          number;
  title:       string;
  public_url:  string;
  start_date:  string;
  end_date:    string;
  organisation?: {
    name: string;
    logo: string;
  };
  filters?: {
    locations?: string[];
    job_type?:  string[];
    salary?:    { min: number; max: number; type: string };
  };
  description?: string;
  short_description?: string;
  skills?: string[];
  status: string;
}

interface UnstopApiResponse {
  data?: {
    data?: UnstopOpportunity[];
    meta?: { total: number; per_page: number; current_page: number };
  };
}

export class UnstopScraper extends BaseScraper {
  private readonly BASE_URL = 'https://unstop.com/api/public/opportunity/search-new';
  private readonly JOB_PAGE = 'https://unstop.com/jobs';

  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const keyword = filters.role || 'software developer';
    const location = filters.location || '';

    logger.info({ keyword, location }, '[Unstop] Starting search');

    try {
      // Fetch up to 2 pages (40 results)
      for (let page = 1; page <= 2; page++) {
        const body = {
          opportunity_type: 'job',
          page,
          size: 20,
          filters: {
            ...(keyword   ? { searchTerm: keyword }   : {}),
            ...(location  ? { location: [location] }  : {}),
            status: ['open'],
          },
        };

        const res = await fetch(this.BASE_URL, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept':       'application/json',
            'User-Agent':   'Mozilla/5.0 (compatible; JobAgent/1.0)',
            'Origin':       'https://unstop.com',
            'Referer':      this.JOB_PAGE,
          },
          body:   JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          logger.warn({ status: res.status, page }, '[Unstop] API error');
          break;
        }

        const json = await res.json() as UnstopApiResponse;
        const opportunities = json?.data?.data ?? [];

        if (opportunities.length === 0) break;

        for (const opp of opportunities) {
          if (!opp.title || !opp.public_url) continue;
          if (opp.status !== 'open') continue;

          const company   = opp.organisation?.name ?? 'Unknown';
          const applyUrl  = opp.public_url.startsWith('http')
            ? opp.public_url
            : `https://unstop.com${opp.public_url}`;

          const locationStr = opp.filters?.locations?.join(', ') ?? location ?? 'India';
          const description = opp.description ?? opp.short_description ?? '';
          const skills      = opp.skills?.join(', ') ?? '';

          let salaryMin: number | undefined;
          let salaryMax: number | undefined;
          const salary = opp.filters?.salary;
          if (salary?.min) salaryMin = salary.min;
          if (salary?.max) salaryMax = salary.max;

          jobs.push({
            externalId:  `unstop-${opp.id}`,
            source:      'unstop',
            title:       opp.title.trim(),
            company:     company.trim(),
            location:    locationStr,
            description: [description, skills ? `Skills: ${skills}` : ''].filter(Boolean).join('\n\n'),
            applyUrl,
            salaryMin,
            salaryMax,
            postedAt:    opp.start_date ? new Date(opp.start_date) : new Date(),
          });
        }

        logger.info({ page, found: opportunities.length, total: jobs.length }, '[Unstop] Page scraped');

        const meta = json?.data?.meta;
        if (!meta || page * meta.per_page >= meta.total) break;

        await this.delay(1000); // polite delay between pages
      }
    } catch (err) {
      logger.error({ err }, '[Unstop] Fetch failed');
    }

    logger.info({ total: jobs.length }, '[Unstop] Done');
    return jobs;
  }
}
