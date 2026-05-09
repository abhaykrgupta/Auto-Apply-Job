import { db } from '@/lib/db';
import { jobs as jobsTable } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { IndeedScraper } from './sources/indeed';
import { LinkedInScraper } from './sources/linkedin';
import { GlassdoorScraper } from './sources/glassdoor';
import { RemoteOKScraper } from './sources/remoteok';
import { WeWorkRemotelyScraper } from './sources/weworkremotely';
import { NaukriScraper } from './sources/naukri';
import { AdzunaScraper } from './sources/adzuna';
import { TheMuseScraper } from './sources/themuse';
import { ArbeitnowScraper } from './sources/arbeitnow';
import { GreenhouseScraper } from './greenhouse';
import { LeverScraper } from './lever';
import { type ScrapedJob } from './base-scraper';
import { logger } from '@/lib/utils/logger';

export type ScraperSource =
  | 'adzuna'
  | 'themuse'
  | 'arbeitnow'
  | 'indeed'
  | 'linkedin'
  | 'glassdoor'
  | 'remoteok'
  | 'weworkremotely'
  | 'naukri'
  | 'greenhouse'
  | 'lever';

export interface UniversalScrapeFilters {
  query?: string;
  location?: string;
  remote?: boolean;
  sources?: ScraperSource[];
  boardUrls?: string[];
  limit?: number;
  datePosted?: string;
}

export interface UniversalScrapeResult {
  total: number;
  unique: number;
  saved: number;
  bySource: Record<string, number>;
}

export class UniversalScraper {
  async scrapeAllSources(filters: UniversalScrapeFilters): Promise<UniversalScrapeResult> {
    const sources = filters.sources ?? ['adzuna', 'themuse', 'arbeitnow', 'remoteok', 'weworkremotely'];
    const bySource: Record<string, number> = {};
    const allJobs: ScrapedJob[] = [];

    const jobFilters = {
      role: filters.query,
      location: filters.location,
      remote: filters.remote ? 'remote' : undefined,
      limit: filters.limit ?? 50,
      datePosted: filters.datePosted,
    };

    for (const source of sources) {
      try {
        let scraped: ScrapedJob[] = [];

        if (source === 'adzuna') {
          scraped = await new AdzunaScraper().searchJobs(jobFilters);
        } else if (source === 'themuse') {
          scraped = await new TheMuseScraper().searchJobs(jobFilters);
        } else if (source === 'arbeitnow') {
          scraped = await new ArbeitnowScraper().searchJobs(jobFilters);
        } else if (source === 'indeed') {
          scraped = await new IndeedScraper().searchJobs(jobFilters);
        } else if (source === 'linkedin') {
          scraped = await new LinkedInScraper().searchJobs(jobFilters);
        } else if (source === 'glassdoor') {
          scraped = await new GlassdoorScraper().searchJobs(jobFilters);
        } else if (source === 'remoteok') {
          scraped = await new RemoteOKScraper().searchJobs(jobFilters);
        } else if (source === 'weworkremotely') {
          scraped = await new WeWorkRemotelyScraper().searchJobs(jobFilters);
        } else if (source === 'naukri') {
          scraped = await new NaukriScraper().searchJobs(jobFilters);
        } else if (source === 'greenhouse' && filters.boardUrls?.length) {
          const gh = new GreenhouseScraper();
          for (const url of filters.boardUrls.filter((u) => u.includes('greenhouse'))) {
            scraped.push(...(await gh.scrapePage(url)));
          }
        } else if (source === 'lever' && filters.boardUrls?.length) {
          const lv = new LeverScraper();
          for (const url of filters.boardUrls.filter((u) => u.includes('lever'))) {
            scraped.push(...(await lv.scrapePage(url)));
          }
        }

        bySource[source] = scraped.length;
        allJobs.push(...scraped);
        logger.info(`${source}: ${scraped.length} jobs`);

        // Rate limit between sources
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        logger.error({ err, source }, `${source} scraping failed`);
        bySource[source] = 0;
      }
    }

    let filteredJobs = allJobs;
    if (filters.datePosted) {
      const now = new Date().getTime();
      const msPerDay = 24 * 60 * 60 * 1000;
      let maxAgeDays = 365;

      switch (filters.datePosted) {
        case '1d': maxAgeDays = 1; break;
        case '2d': maxAgeDays = 2; break;
        case '7d': maxAgeDays = 7; break;
        case '30d': maxAgeDays = 30; break;
      }

      filteredJobs = allJobs.filter((j) => {
        if (!j.postedAt) return maxAgeDays >= 30; // Only keep unknown-date jobs for loose filters
        const ageDays = (now - j.postedAt.getTime()) / msPerDay;
        return ageDays <= maxAgeDays;
      });
    }

    const unique = this.deduplicate(filteredJobs);
    const saved = await this.saveJobs(unique);

    logger.info({ total: allJobs.length, filtered: filteredJobs.length, unique: unique.length, saved }, 'Universal scrape complete');

    return {
      total: filteredJobs.length,
      unique: unique.length,
      saved,
      bySource,
    };
  }

  private deduplicate(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Map<string, ScrapedJob>();

    for (const job of jobs) {
      const key = `${job.company?.toLowerCase().replace(/[^a-z0-9]/g, '')}-${job.title?.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (!seen.has(key)) {
        seen.set(key, job);
      } else {
        const existing = seen.get(key)!;
        if ((job.description?.length ?? 0) > (existing.description?.length ?? 0)) {
          seen.set(key, job);
        }
      }
    }

    return Array.from(seen.values());
  }

  private async saveJobs(jobs: ScrapedJob[]): Promise<number> {
    let saved = 0;

    for (const job of jobs) {
      try {
        if (job.externalId) {
          const existing = await db
            .select({ id: jobsTable.id })
            .from(jobsTable)
            .where(eq(jobsTable.externalId, job.externalId))
            .limit(1);
          if (existing.length > 0) continue;
        }

        // Check for duplicate by company + title (case-insensitive)
        if (job.company && job.title) {
          const existing = await db
            .select({ id: jobsTable.id })
            .from(jobsTable)
            .where(
              sql`lower(${jobsTable.company}) = lower(${job.company}) AND lower(${jobsTable.title}) = lower(${job.title})`
            )
            .limit(1);
          if (existing.length > 0) continue;
        }

        await db.insert(jobsTable).values({
          externalId: job.externalId,
          source: job.source,
          company: job.company,
          title: job.title,
          location: job.location,
          locationType: job.locationType,
          description: job.description || job.title,
          applyUrl: job.applyUrl,
          postedAt: job.postedAt,
          status: 'active',
        });
        saved++;
      } catch {
        // skip duplicates/constraint violations
      }
    }

    return saved;
  }
}
