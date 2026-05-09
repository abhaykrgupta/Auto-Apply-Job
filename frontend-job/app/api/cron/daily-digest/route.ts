import { NextRequest, NextResponse } from 'next/server';
import { EmailNotificationService } from '@/lib/notifications/email-service';
import { telegramService } from '@/lib/notifications/telegram-service';
import { db } from '@/lib/db';
import { jobs, applications, jobMatches } from '@/lib/db/schema';
import { gte, eq, and, count } from 'drizzle-orm';

// Vercel cron: 0 8 * * * (8 AM UTC daily)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = new EmailNotificationService();
  await svc.sendDailyDigest();

  // Gather today's stats for Telegram summary
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [newJobsResult, applicationsResult, highMatchesResult, pendingResult] = await Promise.all([
      db.select({ value: count() }).from(jobs).where(gte(jobs.createdAt, todayStart)),
      db.select({ value: count() }).from(applications).where(and(gte(applications.createdAt, todayStart), eq(applications.status, 'applied'))),
      db.select({ value: count() }).from(jobMatches).where(and(gte(jobMatches.createdAt, todayStart), gte(jobMatches.score, 80))),
      db.select({ value: count() }).from(applications).where(eq(applications.status, 'manual_review')),
    ]);

    await telegramService.notifyDailySummary({
      newJobs: newJobsResult[0]?.value ?? 0,
      applicationsToday: applicationsResult[0]?.value ?? 0,
      highMatches: highMatchesResult[0]?.value ?? 0,
      pendingReview: pendingResult[0]?.value ?? 0,
    });
  } catch {
    // Telegram failure must not break the cron response
  }

  return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
}
