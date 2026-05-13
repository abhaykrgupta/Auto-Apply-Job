/**
 * POST /api/jobs/fetch-from-apis
 * Pulls real jobs from Adzuna + JSearch (RapidAPI) and upserts them into the DB.
 * These are REAL jobs from thousands of companies — no scraping, no ATS slugs.
 *
 * Body:
 *   query        string   — job title / keywords (required)
 *   country      string?  — 'india' | 'us' | 'uk' | 'remote' | ...
 *   datePosted   string?  — 'all' | 'today' | '3days' | 'week' | 'month'
 *   remoteOnly   boolean? — only remote jobs
 *   sources      string[] — ['adzuna', 'jsearch'] (defaults to both)
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { fetchAdzunaJobs } from '@/lib/scrapers/job-apis/adzuna';
import { fetchJSearchJobs } from '@/lib/scrapers/job-apis/jsearch';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      query = '',
      country = 'us',
      datePosted = 'week',
      remoteOnly = false,
      sources = ['adzuna', 'jsearch'],
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    let totalInserted = 0;
    const sourceResults: Record<string, number> = {};

    // ── Adzuna ──────────────────────────────────────────────────────────────
    if (sources.includes('adzuna')) {
      const adzunaJobs = await fetchAdzunaJobs({
        query,
        country: remoteOnly ? 'us' : country,
        maxDaysOld: datePosted === 'today' ? 1 : datePosted === '3days' ? 3 : datePosted === 'week' ? 7 : datePosted === 'month' ? 30 : undefined,
        resultsPerPage: 50,
      });

      let inserted = 0;
      for (const job of adzunaJobs) {
        if (!job.title || !job.applyUrl) continue;
        const result = await db
          .insert(jobs)
          .values({
            externalId: job.externalId,
            source: 'custom',
            company: job.company || 'Unknown',
            title: job.title,
            location: job.location,
            description: job.description,
            applyUrl: job.applyUrl,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            postedAt: job.postedAt,
            status: 'active',
          })
          .onConflictDoNothing();
        inserted++;
      }
      sourceResults.adzuna = inserted;
      totalInserted += inserted;
    }

    // ── JSearch (RapidAPI) ─────────────────────────────────────────────────
    if (sources.includes('jsearch')) {
      const jsearchJobs = await fetchJSearchJobs({
        query,
        country: remoteOnly ? 'remote' : country,
        datePosted: datePosted as any,
        remoteOnly,
        numPages: 2, // 2 pages × 10 results = 20 jobs per call
      });

      let inserted = 0;
      for (const job of jsearchJobs) {
        if (!job.title || !job.applyUrl) continue;
        await db
          .insert(jobs)
          .values({
            externalId: job.externalId,
            source: 'custom',
            company: job.company || 'Unknown',
            title: job.title,
            location: job.location,
            description: job.description,
            applyUrl: job.applyUrl,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            postedAt: job.postedAt,
            status: 'active',
          })
          .onConflictDoNothing();
        inserted++;
      }
      sourceResults.jsearch = inserted;
      totalInserted += inserted;
    }

    return NextResponse.json({
      success: true,
      totalInserted,
      bySource: sourceResults,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch jobs from APIs';
    console.error('[/api/jobs/fetch-from-apis]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
