import { db } from '@/lib/db';
import { applications, jobs, jobMatches } from '@/lib/db/schema';
import { gte, eq, and, inArray } from 'drizzle-orm';

export type TimeRange = 'week' | 'month' | 'all';

function getTimeRangeDate(range: TimeRange): Date {
  const now = Date.now();
  if (range === 'week') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === 'month') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return new Date(0);
}

export class AnalyticsEngine {
  // resumeIds scopes all queries to the current user's data
  constructor(private resumeIds: string[] = []) {}

  async getAdvancedStats(timeRange: TimeRange = 'week') {
    const since = getTimeRangeDate(timeRange);

    const [appStats, platformStats, matchingStats, trends, responseRateBySource, bestTimeData] = await Promise.all([
      this.getApplicationStats(since),
      this.getPlatformStats(since),
      this.getMatchingStats(since),
      this.getTrends(since),
      this.getResponseRateBySource(since),
      this.getBestTimeToApply(since),
    ]);

    return { appStats, platformStats, matchingStats, trends, responseRateBySource, bestTimeData };
  }

  private async getApplicationStats(since: Date) {
    const filter = this.resumeIds.length > 0
      ? and(gte(applications.createdAt, since), inArray(applications.resumeId, this.resumeIds))
      : gte(applications.createdAt, since);
    const rows = await db.select().from(applications).where(filter);

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
    const filter = this.resumeIds.length > 0
      ? and(gte(applications.createdAt, since), inArray(applications.resumeId, this.resumeIds))
      : gte(applications.createdAt, since);
    const rows = await db
      .select({
        status: applications.status,
        source: jobs.source,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(filter);

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
    const filter = this.resumeIds.length > 0
      ? and(gte(applications.createdAt, since), inArray(applications.resumeId, this.resumeIds))
      : gte(applications.createdAt, since);
    const rows = await db
      .select({ status: applications.status, createdAt: applications.createdAt })
      .from(applications)
      .where(filter)
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

  private async getResponseRateBySource(since: Date) {
    const filter = this.resumeIds.length > 0
      ? and(gte(applications.createdAt, since), inArray(applications.resumeId, this.resumeIds))
      : gte(applications.createdAt, since);
    const rows = await db
      .select({
        status: applications.status,
        source: jobs.source,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(filter);

    const bySource: Record<string, { total: number; responded: number }> = {};

    for (const row of rows) {
      const src = row.source ?? 'unknown';
      if (!bySource[src]) bySource[src] = { total: 0, responded: 0 };
      bySource[src].total++;
      if (row.status === 'interviewing' || row.status === 'accepted' || row.status === 'rejected') {
        bySource[src].responded++;
      }
    }

    // responseRateBySource: { source, total, responded, rate }[]
    return Object.entries(bySource).map(([source, s]) => ({
      source,
      total: s.total,
      responded: s.responded,
      rate: s.total > 0 ? Math.round((s.responded / s.total) * 100) : 0,
    }));
  }

  private async getBestTimeToApply(since: Date) {
    const filter = this.resumeIds.length > 0
      ? and(gte(applications.createdAt, since), inArray(applications.resumeId, this.resumeIds))
      : gte(applications.createdAt, since);
    const rows = await db
      .select({ status: applications.status, appliedAt: applications.createdAt })
      .from(applications)
      .where(filter);

    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Index 0=Sun … 6=Sat, but we want Mon-Sun order for display
    const ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const byDay: Record<string, { applications: number; responses: number }> = {};
    for (const label of ORDER) byDay[label] = { applications: 0, responses: 0 };

    for (const row of rows) {
      if (!row.appliedAt) continue;
      const dayIndex = row.appliedAt.getDay(); // 0=Sun
      const label = DAY_LABELS[dayIndex];
      byDay[label].applications++;
      if (row.status === 'interviewing' || row.status === 'accepted' || row.status === 'rejected') {
        byDay[label].responses++;
      }
    }

    // bestTimeData: { day, applications, responses, rate }[] ordered Mon-Sun
    return ORDER.map((day) => ({
      day,
      applications: byDay[day].applications,
      responses: byDay[day].responses,
      rate: byDay[day].applications > 0
        ? Math.round((byDay[day].responses / byDay[day].applications) * 100)
        : 0,
    }));
  }
}
