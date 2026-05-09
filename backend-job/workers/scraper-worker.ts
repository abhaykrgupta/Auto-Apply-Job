/**
 * Scraper Worker — Scraping execution process
 *
 * Handles: scrape_jobs, scrape_company
 *
 * Run:  npx tsx workers/scraper-worker.ts
 *
 * Isolates Playwright-based scraping and selector learning from Next.js runtime.
 */
// Env loaded by --env-file=.env.local at Node startup (see package.json scripts)
import { createWorker } from '@/lib/workers/worker-bootstrap';
import { scrapeAndSaveJobs } from '@/lib/scrapers';
import { UniversalCareerScraper } from '@/lib/scrapers/universal-career-scraper';
import { db } from '@/lib/db';
import { companies, jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import type { ScrapeJobsPayload, ScrapeCompanyPayload, ScrapeJobsResult, ScrapeCompanyResult } from '@/lib/workers/task-types';
import type { WorkerTask } from '@/lib/workers/task-types';

const worker = createWorker('scraper', ['scrape_jobs', 'scrape_company']);

worker.register('scrape_jobs', async (task: WorkerTask<'scrape_jobs'>): Promise<ScrapeJobsResult> => {
  const payload = task.payload as ScrapeJobsPayload;
  logger.info({ sources: payload.sources }, '[scraper] Starting scrape_jobs');
  const result = await scrapeAndSaveJobs({
    role: payload.role,
    location: payload.location,
    remote: payload.remote,
    datePosted: payload.datePosted,
    boardUrls: payload.boardUrls,
  });
  return result;
});

worker.register('scrape_company', async (task: WorkerTask<'scrape_company'>): Promise<ScrapeCompanyResult> => {
  const payload = task.payload as ScrapeCompanyPayload;
  logger.info({ companyId: payload.companyId, name: payload.companyName }, '[scraper] Starting scrape_company');

  const scraper = new UniversalCareerScraper();
  const url = payload.careerPage ?? payload.websiteUrl;
  const scraped = await scraper.scrape(payload.companyName, url);

  let saved = 0;
  for (const job of scraped) {
    try {
      await db.insert(jobs).values({
        externalId: job.externalId,
        source: job.source,
        company: job.company,
        companyId: payload.companyId,
        title: job.title,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        applyUrl: job.applyUrl,
        postedAt: job.postedAt,
      }).onConflictDoNothing();
      saved++;
    } catch {
      // skip duplicates
    }
  }

  // Update lastScrapedAt on the company record
  await db.update(companies)
    .set({ lastScrapedAt: new Date(), activeJobsCount: saved })
    .where(eq(companies.id, payload.companyId));

  return { companyId: payload.companyId, jobsFound: scraped.length, jobsSaved: saved };
});

worker.start().catch((err) => {
  logger.error({ err }, '[scraper] Worker crashed');
  process.exit(1);
});
