import { companyScrapeSchema } from '@/lib/validations/companies';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies, jobs, profile } from '@/lib/db/schema';
import { eq, and, isNotNull, asc, sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { taskQueue } from '@/lib/workers/task-queue';
import { detectATS, findCareerPage } from '@/lib/company-discovery/ats-detector';

// ─── Public JSON API scrapers — no Playwright needed ─────────────────────────

type JobSource = 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'custom';

interface ApiJob {
  externalId: string;
  title: string;
  location: string;
  applyUrl: string;
  source: JobSource;
}

// Sentinel: null means "board URL is wrong / needs re-detection"
type ScrapeResult = ApiJob[] | null;

// Greenhouse public jobs API: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
async function scrapeGreenhouse(atsUrl: string, companyName: string): Promise<ScrapeResult> {
  const match = atsUrl.match(/(?:boards|job-boards)\.greenhouse\.io\/([^/?#\s]+)/i);
  if (!match) {
    logger.warn(`Greenhouse: could not extract slug from ${atsUrl}`);
    return null;
  }
  const slug = match[1];
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } }
    );
    if (res.status === 404) { logger.warn(`Greenhouse API ${slug}: 404 — wrong slug, will self-heal`); return null; }
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
async function scrapeLever(atsUrl: string, companyName: string): Promise<ScrapeResult> {
  const match = atsUrl.match(/jobs\.lever\.co\/([^/?#\s]+)/i);
  if (!match) {
    logger.warn(`Lever: could not extract slug from ${atsUrl}`);
    return null;
  }
  const slug = match[1];
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } }
    );
    if (res.status === 404) { logger.warn(`Lever API ${slug}: 404 — wrong slug, will self-heal`); return null; }
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
async function scrapeAshby(atsUrl: string, companyName: string): Promise<ScrapeResult> {
  const match = atsUrl.match(/(?:jobs\.)?ashbyhq\.com\/([^/?#\s]+)/i);
  if (!match) {
    logger.warn(`Ashby: could not extract slug from ${atsUrl}`);
    return null;
  }
  const slug = match[1];
  try {
    const res = await fetch(
      `https://jobs.ashbyhq.com/api/non-admin/job-board?organizationHostedJobsPageName=${slug}`,
      { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } }
    );
    if (res.status === 404) { logger.warn(`Ashby API ${slug}: 404 — wrong slug, will self-heal`); return null; }
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

// ─── Self-healing: when an ATS URL returns 404, re-detect from company website ─

async function rehealAtsUrl(
  companyId: string,
  websiteUrl: string | null,
): Promise<{ atsType: string | null; atsUrl: string | null }> {
  if (!websiteUrl) return { atsType: null, atsUrl: null };
  try {
    const careerPage = await findCareerPage(websiteUrl);
    if (!careerPage) {
      await db.update(companies).set({ atsType: 'unknown', atsUrl: null, updatedAt: new Date() }).where(eq(companies.id, companyId));
      return { atsType: null, atsUrl: null };
    }
    const ats = await detectATS(careerPage);
    await db.update(companies).set({
      atsType: ats.type,
      atsUrl: ats.url ?? careerPage,
      careerPage,
      updatedAt: new Date(),
    }).where(eq(companies.id, companyId));
    logger.info({ companyId, atsType: ats.type, atsUrl: ats.url }, 'Self-healed ATS URL');
    return { atsType: ats.type, atsUrl: ats.url ?? careerPage };
  } catch {
    await db.update(companies).set({ atsType: 'unknown', atsUrl: null, updatedAt: new Date() }).where(eq(companies.id, companyId));
    return { atsType: null, atsUrl: null };
  }
}

// ─── SSE helper ───────────────────────────────────────────────────────────────

function makeSSEStream(
  handler: (send: (event: string, data: unknown) => void, close: () => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // stream already closed
        }
      };
      const close = () => {
        try { controller.close(); } catch { /* already closed */ }
      };
      handler(send, close).catch((err) => {
        send('error', { message: err instanceof Error ? err.message : 'Unknown error' });
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Check if client wants SSE streaming
  const acceptsSSE = req.headers.get('accept') === 'text/event-stream';

  let parsed: ReturnType<typeof companyScrapeSchema.safeParse>;
  try {
    parsed = companyScrapeSchema.safeParse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (acceptsSSE) {
    // Stream progress events to the client
    return makeSSEStream(async (send, close) => {
      await runScrapeJob(parsed.data, send);
      send('done', { success: true });
      close();
    });
  }

  // Legacy: plain JSON response (backwards-compatible)
  const results = await runScrapeJob(parsed.data, () => {});
  return NextResponse.json({ success: true, ...results });
}

// ─── Core scrape logic (shared between SSE and plain JSON) ────────────────────

async function runScrapeJob(
  params: ReturnType<typeof companyScrapeSchema.safeParse>['data'] & {},
  send: (event: string, data: unknown) => void,
) {
  const limit = (params as any).limit ?? 20;
  const query = (params as any).query;
  const country = (params as any).country?.toLowerCase();

  // Delegate to inner handler — we need the full code below, so call the helper
  return _doScrape({ limit, query, country, params, send });
}

async function _doScrape({
  limit, query, country, params, send,
}: {
  limit: number;
  query?: string;
  country?: string;
  params: any;
  send: (event: string, data: unknown) => void;
}) {
  try {
    // Country → location keyword map (matches company.location field)
    const COUNTRY_KEYWORDS: Record<string, string[]> = {
      india:     ['india', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai', 'gurgaon', 'noida', 'kolkata'],
      us:        ['united states', 'usa', 'san francisco', 'new york', 'seattle', 'austin', 'boston', 'chicago', 'los angeles'],
      uk:        ['united kingdom', 'uk', 'london', 'manchester', 'edinburgh'],
      germany:   ['germany', 'berlin', 'munich', 'hamburg', 'frankfurt'],
      singapore: ['singapore'],
      canada:    ['canada', 'toronto', 'vancouver', 'montreal'],
      australia: ['australia', 'sydney', 'melbourne', 'brisbane'],
      remote:    ['remote', 'worldwide', 'global'],
    };

    // If no query provided, try to use user's preferred role
    let effectiveQuery = query;
    if (!effectiveQuery) {
      const userProfile = await db.select().from(profile).limit(1).then(r => r[0]);
      if (userProfile?.preferredRoles?.length) {
        effectiveQuery = userProfile.preferredRoles[0];
        logger.info(`No query provided for company scraping, using preferred role: ${effectiveQuery}`);
      }
    }

    const queryLower = effectiveQuery?.toLowerCase() || '';
    const exp = params?.experience?.toLowerCase() || 'any';
    const locPref = params?.locationPref?.toLowerCase() || 'any';

    let allCompanies = await db
      .select()
      .from(companies)
      .where(and(isNotNull(companies.atsUrl), eq(companies.scrapingEnabled, true)))
      .orderBy(sql`${companies.lastScrapedAt} ASC NULLS FIRST`);

    // Filter by country if specified
    if (country && COUNTRY_KEYWORDS[country]) {
      const keywords = COUNTRY_KEYWORDS[country];
      allCompanies = allCompanies.filter(c => {
        const loc = (c.location ?? '').toLowerCase();
        return keywords.some(k => loc.includes(k));
      });
      logger.info(`Country filter "${country}": ${allCompanies.length} companies match`);
    }

    const companiesToScrape = allCompanies.slice(0, limit);

    const results = { scraped: 0, jobsFound: 0, errors: 0, skipped: 0 };

    for (const company of companiesToScrape) {
      if (!company.atsUrl) continue;

      // No cooldown check on manual UI trigger — allow the user to scrape whenever they click


      try {
        let scrapeResult: ScrapeResult = [];

        switch (company.atsType) {
          case 'greenhouse':
            scrapeResult = await scrapeGreenhouse(company.atsUrl, company.name);
            break;
          case 'lever':
            scrapeResult = await scrapeLever(company.atsUrl, company.name);
            break;
          case 'ashby':
            scrapeResult = await scrapeAshby(company.atsUrl, company.name);
            break;
          case 'smartrecruiters':
            scrapeResult = await scrapeSmartRecruiters(company.atsUrl, company.name);
            break;
          case 'workday':
            scrapeResult = await scrapeWorkday(company.atsUrl, company.name);
            break;
          case 'bamboohr':
            scrapeResult = await scrapeBambooHR(company.atsUrl, company.name);
            break;
          default:
            // custom, unknown — queue for deep AI scraping
            if (company.website || company.atsUrl) {
              await taskQueue.enqueue('scrape_company', {
                companyId: company.id,
                companyName: company.name,
                websiteUrl: company.website || company.atsUrl || '',
                careerPage: company.atsUrl || company.website || '',
              });
              logger.info(`Queued ${company.name} for deep AI scraping in background worker`);
            }
            results.skipped++;
            continue;
        }

        // null = wrong ATS slug — self-heal and re-try once
        if (scrapeResult === null) {
          logger.info(`${company.name}: self-healing ATS URL from website ${company.website}`);
          const healed = await rehealAtsUrl(company.id, company.website ?? null);
          if (healed.atsUrl && healed.atsType && healed.atsType !== 'unknown') {
            switch (healed.atsType) {
              case 'greenhouse': scrapeResult = await scrapeGreenhouse(healed.atsUrl, company.name); break;
              case 'lever':      scrapeResult = await scrapeLever(healed.atsUrl, company.name); break;
              case 'ashby':      scrapeResult = await scrapeAshby(healed.atsUrl, company.name); break;
              default:           scrapeResult = [];
            }
          } else {
            // Still can't find it — queue for background deep scrape
            if (company.website) {
              await taskQueue.enqueue('scrape_company', {
                companyId: company.id,
                companyName: company.name,
                websiteUrl: company.website,
                careerPage: company.website,
              });
            }
            results.skipped++;
            continue;
          }
        }

        let foundJobs: ApiJob[] = scrapeResult ?? [];

        // Apply role/query filtering if specified
        if (queryLower) {
          const searchTerms = queryLower.split(/\\s+/).filter(Boolean);
          const originalCount = foundJobs.length;
          foundJobs = foundJobs.filter(j => {
            const searchString = `${j.title} ${j.location || ''}`.toLowerCase();
            return searchTerms.every(term => searchString.includes(term));
          });
          if (originalCount > 0 && foundJobs.length === 0) {
            logger.info(`${company.name}: Filtered out all ${originalCount} jobs (no match for "${queryLower}")`);
          } else if (foundJobs.length < originalCount) {
            logger.info(`${company.name}: Filtered ${originalCount} -> ${foundJobs.length} jobs for "${queryLower}"`);
          }
        }

        // Apply experience filtering
        if (exp !== 'any') {
          const originalCount = foundJobs.length;
          foundJobs = foundJobs.filter(j => {
            const title = j.title.toLowerCase();
            if (exp === 'fresher') {
              return title.includes('junior') || title.includes('entry') || title.includes('associate') || title.includes('grad') || title.includes('intern');
            }
            if (exp === 'senior') {
              return title.includes('senior') || title.includes('lead') || title.includes('staff') || title.includes('principal') || title.includes('sr.');
            }
            if (['1-2', '2-3', '3-5', '5-7'].includes(exp)) {
              if (exp === '1-2' || exp === '2-3') return !title.includes('senior') && !title.includes('staff') && !title.includes('principal');
              if (exp === '3-5' || exp === '5-7') return title.includes('senior') || (!title.includes('junior') && !title.includes('intern'));
            }
            return true;
          });
          if (originalCount > 0 && foundJobs.length < originalCount) {
            logger.info(`${company.name}: Filtered ${originalCount} -> ${foundJobs.length} jobs for experience: ${exp}`);
          }
        }

        // Apply location preference filtering
        if (locPref !== 'any') {
          const originalCount = foundJobs.length;
          foundJobs = foundJobs.filter(j => {
            const locStr = (j.location || '').toLowerCase();
            const titleStr = j.title.toLowerCase();
            const isRemote = locStr.includes('remote') || titleStr.includes('remote');
            const isHybrid = locStr.includes('hybrid') || titleStr.includes('hybrid');
            
            if (locPref === 'remote' && !isRemote) return false;
            if (locPref === 'hybrid' && !isHybrid) return false;
            if (locPref === 'onsite' && (isRemote || isHybrid)) return false;
            return true;
          });
          if (originalCount > 0 && foundJobs.length < originalCount) {
            logger.info(`${company.name}: Filtered ${originalCount} -> ${foundJobs.length} jobs for location preference: ${locPref}`);
          }
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

        // Update company job stats
        await db
          .update(companies)
          .set({
            activeJobsCount: foundJobs.length,
            totalJobsFound: (company.totalJobsFound ?? 0) + foundJobs.length,
          })
          .where(eq(companies.id, company.id));

        results.scraped++;
        results.jobsFound += foundJobs.length;
        send('progress', {
          company: company.name,
          atsType: company.atsType,
          jobsFound: foundJobs.length,
          total: companiesToScrape.length,
          done: results.scraped + results.errors + results.skipped,
        });
        logger.info(`${company.name} (${company.atsType}): found ${foundJobs.length} jobs`);

      } catch (err) {
        results.errors++;
        logger.error({ err }, `Failed to scrape ${company.name}`);
        send('progress', {
          company: company.name,
          error: err instanceof Error ? err.message : 'Unknown error',
          total: companiesToScrape.length,
          done: results.scraped + results.errors + results.skipped,
        });
      } finally {
        // ALWAYS update lastScrapedAt so this company goes to the back of the queue
        // even if it failed, preventing poison-pill infinite loops.
        await db
          .update(companies)
          .set({ lastScrapedAt: new Date(), updatedAt: new Date() })
          .where(eq(companies.id, company.id));
      }
    }

    return results;
  } catch (err) {
    logger.error({ err }, 'scrape-jobs _doScrape failed');
    throw err;
  }
}
