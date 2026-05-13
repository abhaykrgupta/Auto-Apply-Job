/**
 * GET /api/cron/detect-ats
 * Nightly cron: runs ATS detection on companies that are 'unknown' or haven't been
 * checked in 7+ days. Processes up to `batchSize` companies per invocation.
 *
 * Set up in Vercel dashboard:
 *   Path:     /api/cron/detect-ats
 *   Schedule: 0 2 * * *   (2 AM UTC daily)
 *
 * Auth: CRON_SECRET env var (sent as Authorization: Bearer <secret>)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { eq, or, isNull, lte, and } from 'drizzle-orm';
import { detectATS, findCareerPage } from '@/lib/company-discovery/ats-detector';

const BATCH_SIZE = 50; // companies per cron run
const STALE_DAYS = 7;  // re-check every 7 days

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets Authorization header automatically when you configure it)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  // Fetch companies that are 'unknown' ATS or haven't been checked in 7+ days
  const targets = await db
    .select()
    .from(companies)
    .where(
      or(
        eq(companies.atsType, 'unknown'),
        isNull(companies.atsType),
        and(
          isNull(companies.atsUrl),
          lte(companies.updatedAt, staleThreshold),
        ),
      )
    )
    .limit(BATCH_SIZE);

  let detected = 0;
  let unchanged = 0;
  let failed = 0;

  for (const company of targets) {
    const websiteUrl = company.website ?? company.careerPage;
    if (!websiteUrl) { unchanged++; continue; }

    try {
      const careerPage = await findCareerPage(websiteUrl);
      if (!careerPage) {
        await db
          .update(companies)
          .set({ updatedAt: new Date() })
          .where(eq(companies.id, company.id));
        unchanged++;
        continue;
      }

      const ats = await detectATS(careerPage);
      await db
        .update(companies)
        .set({
          atsType: ats.type,
          atsUrl: ats.url ?? careerPage,
          careerPage,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, company.id));

      if (ats.type !== 'unknown') detected++;
      else unchanged++;
    } catch {
      failed++;
      // Still bump updatedAt so it doesn't re-trigger tomorrow
      await db
        .update(companies)
        .set({ updatedAt: new Date() })
        .where(eq(companies.id, company.id));
    }
  }

  return NextResponse.json({
    processed: targets.length,
    detected,
    unchanged,
    failed,
  });
}
