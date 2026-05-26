import { NextRequest, NextResponse } from 'next/server';
import { AutoJobPipeline } from '@/lib/automation/auto-job-pipeline';
import { scrapeAndSaveJobs } from '@/lib/scrapers';
import { telegramService } from '@/lib/notifications/telegram-service';
import { db } from '@/lib/db';
import { profile } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { timingSafeEqual } from 'crypto';

// Vercel cron: 0 4 * * * (4 AM UTC daily)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = (authHeader ?? '').replace(/^Bearer /, '');
  let authorized = false;
  try {
    const a = Buffer.from(token.padEnd(expected.length));
    const b = Buffer.from(expected);
    authorized = a.length === b.length && timingSafeEqual(a, b);
  } catch { authorized = false; }
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile preferences
  const userProfile = await db.query.profile.findFirst({
    orderBy: [desc(profile.createdAt)],
  });

  // Run scraper first to populate database with fresh jobs
  const scrapeResult = await scrapeAndSaveJobs({
    role: userProfile?.preferredRoles?.[0] || 'software engineer',
    location: userProfile?.preferredLocations?.[0] || undefined,
    remote: userProfile?.remotePreference || undefined,
  });

  const { scrapeCompanyCareerPages } = await import('@/lib/scrapers');
  const careerResults = await scrapeCompanyCareerPages({
    role: userProfile?.preferredRoles?.[0] || 'software engineer',
    location: userProfile?.preferredLocations?.[0] || undefined,
    remote: userProfile?.remotePreference || undefined,
  }, 100);

  const { logger } = await import('@/lib/utils/logger');
  logger.info({ jobBoards: scrapeResult, careerPages: careerResults }, 'Cron job scraping summary');

  // Notify Telegram that discovery phase is complete
  telegramService.notifyDiscoveryComplete({
    newCompanies: (careerResults as { saved?: number }).saved ?? 0,
    total: (careerResults as { found?: number }).found ?? 0,
  }).catch(() => {});

  // Run matching and notifications pipeline
  const pipeline = new AutoJobPipeline();
  const pipelineResult = await pipeline.runDailyPipeline();

  return NextResponse.json({
    success: true,
    scraped: scrapeResult,
    pipeline: pipelineResult,
    timestamp: new Date().toISOString(),
  });
}

