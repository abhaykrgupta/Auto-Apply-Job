import { companyScrapeSchema } from '@/lib/validations/companies';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies, jobs } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

// ─── Public JSON API scrapers — no Playwright needed ─────────────────────────

type JobSource = 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'custom';

interface ApiJob {
  externalId: string;
  title: string;
  location: string;
  applyUrl: string;
  source: JobSource;
}

// Greenhouse public jobs API: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
async function scrapeGreenhouse(atsUrl: string, companyName: string): Promise<ApiJob[]> {
  const match = atsUrl.match(/(?:boards|job-boards)\.greenhouse\.io\/([^/?#\s]+)/i);
  if (!match) {
    logger.warn(`Greenhouse: could not extract slug from ${atsUrl}`);
    return [];
  }
  const slug = match[1];
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } }
    );
    if (!res.ok) { logger.warn(`Greenhouse API ${slug}: HTTP ${res.status}`); return []; }
    const data = await res.json();
    return (data.jobs ?? []).map((j: any) => ({
      externalId: String(j.id),
      title: j.title ?? '',
      location: j.location?.name ?? '',
      applyUrl: j.absolute_url ?? '',
      source: 'greenhouse' as JobSource,
    })).filter((j: ApiJob) => j.title && j.applyUrl);
  } catch (err) {
    logger.error({ err }, `Greenhouse API failed for ${slug}`);
    return [];
  }
}

// Lever public postings API: https://api.lever.co/v0/postings/{slug}?mode=json
async function scrapeLever(atsUrl: string, companyName: string): Promise<ApiJob[]> {
  const match = atsUrl.match(/jobs\.lever\.co\/([^/?#\s]+)/i);
  if (!match) {
    logger.warn(`Lever: could not extract slug from ${atsUrl}`);
    return [];
  }
  const slug = match[1];
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } }
    );
    if (!res.ok) { logger.warn(`Lever API ${slug}: HTTP ${res.status}`); return []; }
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    return list.map((j: any) => ({
      externalId: j.id ?? '',
      title: j.text ?? '',
      location: j.categories?.location ?? j.categories?.allLocations?.[0] ?? '',
      applyUrl: j.urls?.apply ?? j.hostedUrl ?? `https://jobs.lever.co/${slug}/${j.id}`,
      source: 'lever' as JobSource,
    })).filter((j: ApiJob) => j.title && j.applyUrl);
  } catch (err) {
    logger.error({ err }, `Lever API failed for ${slug}`);
    return [];
  }
}

// Ashby public job board API
async function scrapeAshby(atsUrl: string, companyName: string): Promise<ApiJob[]> {
  const match = atsUrl.match(/(?:jobs\.)?ashbyhq\.com\/([^/?#\s]+)/i);
  if (!match) {
    logger.warn(`Ashby: could not extract slug from ${atsUrl}`);
    return [];
  }
  const slug = match[1];
  try {
    const res = await fetch(
      `https://jobs.ashbyhq.com/api/non-admin/job-board?organizationHostedJobsPageName=${slug}`,
      { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } }
    );
    if (!res.ok) { logger.warn(`Ashby API ${slug}: HTTP ${res.status}`); return []; }
    const data = await res.json();
    return (data.jobPostings ?? [])
      .filter((j: any) => j.isListed !== false)
      .map((j: any) => ({
        externalId: j.id ?? '',
        title: j.title ?? '',
        location: j.locationName ?? j.location ?? '',
        applyUrl: `https://jobs.ashbyhq.com/${slug}/${j.id}`,
        source: 'ashby' as JobSource,
      }))
      .filter((j: ApiJob) => j.title && j.applyUrl);
  } catch (err) {
    logger.error({ err }, `Ashby API failed for ${slug}`);
    return [];
  }
}

// SmartRecruiters public postings API
async function scrapeSmartRecruiters(atsUrl: string, companyName: string): Promise<ApiJob[]> {
  const match = atsUrl.match(/smartrecruiters\.com\/([^/?#\s]+)/i);
  if (!match) {
    logger.warn(`SmartRecruiters: could not extract slug from ${atsUrl}`);
    return [];
  }
  const slug = match[1];
  try {
    const res = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${slug}/postings?status=PUBLIC&limit=100`,
      { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } }
    );
    if (!res.ok) { logger.warn(`SmartRecruiters API ${slug}: HTTP ${res.status}`); return []; }
    const data = await res.json();
    return (data.content ?? []).map((j: any) => ({
      externalId: j.id ?? '',
      title: j.name ?? '',
      location: [j.location?.city, j.location?.country].filter(Boolean).join(', '),
      applyUrl: `https://careers.smartrecruiters.com/${slug}/${j.id}`,
      source: 'custom' as JobSource,
    })).filter((j: ApiJob) => j.title && j.applyUrl);
  } catch (err) {
    logger.error({ err }, `SmartRecruiters API failed for ${slug}`);
    return [];
  }
}

// Workday public CXS API — every Workday job board exposes this POST endpoint
// atsUrl must be in format: https://{tenant}.wd{n}.myworkdayjobs.com/{jobboard}
async function scrapeWorkday(atsUrl: string, companyName: string): Promise<ApiJob[]> {
  const match = atsUrl.match(/https?:\/\/([^.]+)\.(wd\d+)\.myworkdayjobs\.com(?:\/[a-z]{2}-[A-Z]{2})?\/([^/?#\s]+)/i);
  if (!match) {
    logger.warn(`Workday: could not parse URL ${atsUrl}`);
    return [];
  }
  const [, tenant, wdNum, jobboard] = match;
  const apiUrl = `https://${tenant}.${wdNum}.myworkdayjobs.com/wday/cxs/${tenant}/${jobboard}/jobs`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(20_000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: '' }),
    });
    if (!res.ok) { logger.warn(`Workday API ${tenant}: HTTP ${res.status}`); return []; }
    const data = await res.json();
    return (data.jobPostings ?? []).map((j: any) => ({
      externalId: j.bulletFields?.[0] ?? j.externalPath ?? j.title,
      title: j.title ?? '',
      location: j.locationsText ?? '',
      applyUrl: `https://${tenant}.${wdNum}.myworkdayjobs.com${j.externalPath ?? ''}`,
      source: 'workday' as JobSource,
    })).filter((j: ApiJob) => j.title && j.applyUrl);
  } catch (err) {
    logger.error({ err }, `Workday API failed for ${tenant}`);
    return [];
  }
}

// BambooHR public careers list API
async function scrapeBambooHR(atsUrl: string, companyName: string): Promise<ApiJob[]> {
  const match = atsUrl.match(/([^./]+)\.bamboohr\.com/i);
  if (!match) {
    logger.warn(`BambooHR: could not extract slug from ${atsUrl}`);
    return [];
  }
  const slug = match[1];
  try {
    const res = await fetch(
      `https://${slug}.bamboohr.com/careers/list`,
      { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } }
    );
    if (!res.ok) { logger.warn(`BambooHR API ${slug}: HTTP ${res.status}`); return []; }
    const data = await res.json();
    return (data.result ?? []).map((j: any) => ({
      externalId: String(j.id ?? ''),
      title: j.jobOpeningName ?? j.title ?? '',
      location: j.location?.city ?? '',
      applyUrl: `https://${slug}.bamboohr.com/careers/${j.id}`,
      source: 'custom' as JobSource,
    })).filter((j: ApiJob) => j.title && j.applyUrl);
  } catch (err) {
    logger.error({ err }, `BambooHR API failed for ${slug}`);
    return [];
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const parsed = companyScrapeSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const limit = parsed.data.limit ?? 20;

    const companiesToScrape = await db
      .select()
      .from(companies)
      .where(and(isNotNull(companies.atsUrl), eq(companies.scrapingEnabled, true)))
      .limit(limit);

    const results = { scraped: 0, jobsFound: 0, errors: 0, skipped: 0 };

    for (const company of companiesToScrape) {
      if (!company.atsUrl) continue;

      try {
        let foundJobs: ApiJob[] = [];

        switch (company.atsType) {
          case 'greenhouse':
            foundJobs = await scrapeGreenhouse(company.atsUrl, company.name);
            break;
          case 'lever':
            foundJobs = await scrapeLever(company.atsUrl, company.name);
            break;
          case 'ashby':
            foundJobs = await scrapeAshby(company.atsUrl, company.name);
            break;
          case 'smartrecruiters':
            foundJobs = await scrapeSmartRecruiters(company.atsUrl, company.name);
            break;
          case 'workday':
            foundJobs = await scrapeWorkday(company.atsUrl, company.name);
            break;
          case 'bamboohr':
            foundJobs = await scrapeBambooHR(company.atsUrl, company.name);
            break;
          default:
            // custom, unknown — no scraper
            results.skipped++;
            logger.info(`Skipping ${company.name} (atsType: ${company.atsType ?? 'none'} — no scraper)`);
            continue;
        }

        // Upsert jobs
        for (const job of foundJobs) {
          if (!job.applyUrl || !job.title) continue;
          await db
            .insert(jobs)
            .values({
              externalId: job.externalId || `${company.id}-${job.title.slice(0, 40)}`,
              source: job.source,
              company: company.name,
              companyId: company.id,
              title: job.title,
              location: job.location,
              description: job.title,
              applyUrl: job.applyUrl,
              status: 'active',
            })
            .onConflictDoNothing();
        }

        // Update company stats
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
        logger.info(`${company.name} (${company.atsType}): found ${foundJobs.length} jobs`);

      } catch (err) {
        results.errors++;
        logger.error({ err }, `Failed to scrape ${company.name}`);
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    logger.error({ err }, 'scrape-jobs route failed');
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 });
  }
}
