import { db } from '@/lib/db';
import { applications, jobs, jobMatches } from '@/lib/db/schema';
import { gte, eq, desc } from 'drizzle-orm';

export type TimeRange = 'week' | 'month' | 'all';

function getTimeRangeDate(range: TimeRange): Date {
  const now = Date.now();
  if (range === 'week') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === 'month') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return new Date(0);
}

export class AnalyticsEngine {
  async getAdvancedStats(timeRange: TimeRange = 'week') {
    const since = getTimeRangeDate(timeRange);

    const [appStats, platformStats, matchingStats, trends] = await Promise.all([
      this.getApplicationStats(since),
      this.getPlatformStats(since),
      this.getMatchingStats(since),
      this.getTrends(since),
    ]);

    return { appStats, platformStats, matchingStats, trends };
  }

  private async getApplicationStats(since: Date) {
    const rows = await db.select().from(applications).where(gte(applications.createdAt, since));

    const total = rows.length;
    const applied = rows.filter((a) => a.status === 'applied').length;
    const failed = rows.filter((a) => a.status === 'failed').length;
    const manualReview = rows.filter((a) => a.status === 'manual_review').length;
    const interviewing = rows.filter((a) => a.status === 'interviewing').length;
    const accepted = rows.filter((a) => a.status === 'accepted').length;
    const pending = rows.filter((a) => a.status === 'pending').length;

    return {
      total,
      applied,
      failed,
      manualReview,
      interviewing,
      accepted,
      pending,
      successRate: total > 0 ? Math.round((applied / total) * 100) : 0,
    };
  }

  private async getPlatformStats(since: Date) {
    const rows = await db
      .select({
        status: applications.status,
        source: jobs.source,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(gte(applications.createdAt, since));

    const byPlatform: Record<string, { total: number; applied: number; failed: number }> = {};

    for (const row of rows) {
      const src = row.source ?? 'unknown';
      if (!byPlatform[src]) byPlatform[src] = { total: 0, applied: 0, failed: 0 };
      byPlatform[src].total++;
      if (row.status === 'applied') byPlatform[src].applied++;
      if (row.status === 'failed') byPlatform[src].failed++;
    }

    return Object.entries(byPlatform).map(([source, s]) => ({
      source,
      ...s,
      successRate: s.total > 0 ? Math.round((s.applied / s.total) * 100) : 0,
    }));
  }

  private async getMatchingStats(since: Date) {
    const rows = await db
      .select({ score: jobMatches.score })
      .from(jobMatches)
      .where(gte(jobMatches.createdAt, since));

    const scores = rows.map((r) => r.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      totalMatches: rows.length,
      avgScore: avg,
      highMatches: scores.filter((s) => s >= 80).length,
      mediumMatches: scores.filter((s) => s >= 60 && s < 80).length,
      lowMatches: scores.filter((s) => s < 60).length,
    };
  }

  private async getTrends(since: Date) {
    const rows = await db
      .select({ status: applications.status, createdAt: applications.createdAt })
      .from(applications)
      .where(gte(applications.createdAt, since))
      .orderBy(applications.createdAt);

    const byDate: Record<string, { date: string; total: number; applied: number; failed: number }> = {};

    for (const row of rows) {
      if (!row.createdAt) continue;
      const date = row.createdAt.toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { date, total: 0, applied: 0, failed: 0 };
      byDate[date].total++;
      if (row.status === 'applied') byDate[date].applied++;
      if (row.status === 'failed') byDate[date].failed++;
    }

    return Object.values(byDate);
  }
}
