import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { GreenhouseScraper } from './greenhouse';
import { LeverScraper } from './lever';
import { type ScrapedJob } from './base-scraper';
import { logger } from '@/lib/utils/logger';

export interface ScrapeConfig {
  role?: string;
  location?: string;
  remote?: string;
  boardUrls?: string[];
}

export async function scrapeAndSaveJobs(config: ScrapeConfig) {
  const scrapers = [new GreenhouseScraper(), new LeverScraper()];
  const allJobs: ScrapedJob[] = [];

  // If specific board URLs provided, scrape them
  if (config.boardUrls?.length) {
    for (const url of config.boardUrls) {
      if (url.includes('greenhouse.io')) {
        const gh = new GreenhouseScraper();
        const scraped = await gh.scrapePage(url);
        allJobs.push(...scraped);
      } else if (url.includes('lever.co')) {
        const lv = new LeverScraper();
        const scraped = await lv.scrapePage(url);
        allJobs.push(...scraped);
      }
    }
  }

  // Save to DB, skip duplicates
  let saved = 0;
  for (const job of allJobs) {
    try {
      await db
        .insert(jobs)
        .values({
          externalId: job.externalId,
          source: job.source,
          company: job.company,
          title: job.title,
          location: job.location,
          locationType: job.locationType,
          description: job.description,
          requirements: job.requirements,
          applyUrl: job.applyUrl,
          postedAt: job.postedAt,
          status: 'active',
        })
        .onConflictDoNothing();
      saved++;
    } catch {
      // Skip duplicates
    }
  }

  logger.info(`Saved ${saved} new jobs`);
  return { found: allJobs.length, saved };
}
