import { companyScrapeSchema } from '@/lib/validations/companies';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies, jobs } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { GreenhouseScraper } from '@/lib/scrapers/greenhouse';
import { LeverScraper } from '@/lib/scrapers/lever';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const parsed = companyScrapeSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;
    const limit = body.limit ?? 20;

    const companiesToScrape = await db
      .select()
      .from(companies)
      .where(and(isNotNull(companies.atsUrl), eq(companies.scrapingEnabled, true)))
      .limit(limit);

    const results = { scraped: 0, jobsFound: 0, errors: 0 };

    for (const company of companiesToScrape) {
      if (!company.atsUrl) continue;

      try {
        let foundJobs: any[] = [];

        if (company.atsType === 'greenhouse') {
          const scraper = new GreenhouseScraper();
          foundJobs = await scraper.scrapePage(company.atsUrl);
        } else if (company.atsType === 'lever') {
          const scraper = new LeverScraper();
          foundJobs = await scraper.scrapePage(company.atsUrl);
        }

        for (const job of foundJobs) {
          await db
            .insert(jobs)
            .values({
              externalId: job.externalId,
              source: job.source,
              company: company.name,
              companyId: company.id,
              title: job.title,
              location: job.location,
              description: job.description ?? job.title,
              applyUrl: job.applyUrl,
              status: 'active',
            })
            .onConflictDoNothing();
        }

        await db
          .update(companies)
          .set({
            activeJobsCount: foundJobs.length,
            lastScrapedAt: new Date(),
            totalJobsFound: (company.totalJobsFound ?? 0) + foundJobs.length,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, company.id));

        results.scraped++;
        results.jobsFound += foundJobs.length;
        logger.info(`${company.name}: found ${foundJobs.length} jobs`);
      } catch (err) {
        results.errors++;
        logger.error({ err }, `Failed to scrape ${company.name}`);
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 });
  }
}
