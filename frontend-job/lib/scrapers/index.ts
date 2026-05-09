import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { GreenhouseScraper } from './greenhouse';
import { LeverScraper } from './lever';
import { RemoteOKScraper } from './sources/remoteok';
import { WeWorkRemotelyScraper } from './sources/weworkremotely';
import { TheMuseScraper } from './sources/themuse';
import { ArbeitnowScraper } from './sources/arbeitnow';
import { AdzunaScraper } from './sources/adzuna';
import { IndeedScraper } from './sources/indeed';
import { NaukriScraper } from './sources/naukri';
import { GlassdoorScraper } from './sources/glassdoor';
import { type ScrapedJob } from './base-scraper';
import { logger } from '@/lib/utils/logger';

export interface ScrapeConfig {
  role?: string;
  location?: string;
  remote?: string;
  boardUrls?: string[];
  datePosted?: string;
}

export async function scrapeAndSaveJobs(config: ScrapeConfig) {
  const scrapers = [
    new GreenhouseScraper(),
    new LeverScraper(),
    new RemoteOKScraper(),
    new WeWorkRemotelyScraper(),
    new TheMuseScraper(),
    new ArbeitnowScraper(),
    new IndeedScraper(),
    new NaukriScraper(),
    new GlassdoorScraper(),
  ];

  // Only run Adzuna if API keys are present
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    scrapers.push(new AdzunaScraper());
  }

  // 1. Run all scrapers in parallel
  const results = await Promise.allSettled(
    scrapers.map(async (scraper) => {
      try {
        const result = await scraper.searchJobs({
          role: config.role,
          location: config.location,
          remote: config.remote,
          datePosted: config.datePosted,
        });
        return { scraperName: scraper.constructor.name, jobs: result };
      } catch (err) {
        logger.error({ err, scraper: scraper.constructor.name }, 'Scraper failed');
        return { scraperName: scraper.constructor.name, jobs: [] as ScrapedJob[] };
      }
    })
  );

  // 2. Merge and deduplicate results
  const allJobs: ScrapedJob[] = [];
  const bySource: Record<string, number> = {};

  for (const res of results) {
    if (res.status === 'fulfilled') {
      const sourceJobs = res.value.jobs;
      allJobs.push(...sourceJobs);
      bySource[res.value.scraperName] = sourceJobs.length;
    }
  }

  // Deduplicate by applyUrl
  const seenUrls = new Set<string>();
  const deduplicatedJobs: ScrapedJob[] = [];

  for (const job of allJobs) {
    if (!job.applyUrl) continue;
    
    // Normalize URL slightly (optional but good practice)
    const url = job.applyUrl.trim().split('?')[0]; // strip query params for deduplication if needed, but safer to keep it exact:
    const exactUrl = job.applyUrl.trim();
    
    if (!seenUrls.has(exactUrl)) {
      seenUrls.add(exactUrl);
      deduplicatedJobs.push(job);
    }
  }

  // 3. Save to database
  let saved = 0;
  for (const job of deduplicatedJobs) {
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
    } catch (err) {
      // Skip DB insert errors (e.g. duplicate keys that onConflictDoNothing missed, or validation errors)
      logger.error({ err, url: job.applyUrl }, 'Failed to insert scraped job');
    }
  }

  logger.info(`Scraped ${allJobs.length} jobs, ${deduplicatedJobs.length} unique, saved ${saved} new jobs`);
  
  return {
    found: allJobs.length,
    deduplicated: deduplicatedJobs.length,
    saved,
    bySource
  };
}

export async function scrapeCompanyCareerPages(
  filters: ScrapeConfig,
  maxCompanies = 50
): Promise<{ found: number; saved: number; byCompany: Record<string, number> }> {
  const { discoverViaGoogleJobs } = await import('@/lib/company-discovery/sources/google-jobs-search');
  const { discoverViaProductHunt } = await import('@/lib/company-discovery/sources/producthunt');
  const { UniversalCareerScraper } = await import('./universal-career-scraper');
  const { companies, jobs } = await import('@/lib/db/schema');
  const { isNull, lte, or, asc } = await import('drizzle-orm');

  let targetCompanies: { id?: string; name: string; websiteUrl: string }[] = [];

  // 1. Fetch from DB
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dbCompanies = await db.query.companies.findMany({
    where: or(isNull(companies.lastScrapedAt), lte(companies.lastScrapedAt, oneDayAgo)),
    limit: maxCompanies,
    orderBy: [asc(companies.lastScrapedAt)],
  });

  for (const c of dbCompanies) {
    if (c.website) {
      targetCompanies.push({ id: c.id, name: c.name, websiteUrl: c.website });
    }
  }

  // 2. Fetch new companies if we need more
  if (targetCompanies.length < maxCompanies) {
    const role = filters.role || 'software engineer';
    const loc = filters.location || 'remote';
    
    const [googleCos, phCos] = await Promise.all([
      discoverViaGoogleJobs(role, loc),
      discoverViaProductHunt()
    ]);
    
    for (const c of [...googleCos, ...phCos]) {
      if (!targetCompanies.find(existing => existing.name === c.name || existing.websiteUrl === c.websiteUrl)) {
        targetCompanies.push({ name: c.name, websiteUrl: c.websiteUrl });
      }
      if (targetCompanies.length >= maxCompanies) break;
    }
  }

  // 3. Scrape in batches of 5
  const scraper = new UniversalCareerScraper();
  let found = 0;
  let saved = 0;
  const byCompany: Record<string, number> = {};

  for (let i = 0; i < targetCompanies.length; i += 5) {
    const batch = targetCompanies.slice(i, i + 5);
    
    await Promise.allSettled(batch.map(async (company) => {
      const scrapedJobs = await scraper.scrape(company.name, company.websiteUrl, filters);
      
      byCompany[company.name] = scrapedJobs.length;
      found += scrapedJobs.length;

      for (const job of scrapedJobs) {
        try {
          await db.insert(jobs).values({
            externalId: job.externalId,
            source: job.source,
            company: company.name,
            companyId: company.id,
            title: job.title,
            location: job.location,
            locationType: job.locationType,
            description: job.description,
            requirements: job.requirements,
            applyUrl: job.applyUrl,
            postedAt: job.postedAt,
            status: 'active',
          }).onConflictDoNothing();
          saved++;
        } catch (err) {
          logger.error({ err, url: job.applyUrl }, 'Failed to insert company scraped job');
        }
      }

      if (company.id) {
        const { eq } = await import('drizzle-orm');
        await db.update(companies)
          .set({ lastScrapedAt: new Date() })
          .where(eq(companies.id, company.id));
      }
    }));
  }

  return { found, saved, byCompany };
}
