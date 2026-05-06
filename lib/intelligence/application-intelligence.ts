import { db } from '@/lib/db';
import {
  applications, jobs, resumes,
  resumePerformance, keywordPerformance, companyResponseMetrics,
} from '@/lib/db/schema';
import { eq, sql, and, gte, ne } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

/**
 * Application Intelligence Service
 *
 * Tracks application outcomes and aggregates learning signals for adaptive
 * strategy optimization.
 *
 * Called by:
 *  - PATCH /api/applications/[id] when status changes
 *  - Cron jobs for batch recompute
 */

type ApplicationStatus = 'applied' | 'failed' | 'manual_review' | 'interviewing' | 'rejected' | 'accepted' | 'pending';

export interface OutcomeEvent {
  applicationId: string;
  newStatus: ApplicationStatus;
  previousStatus?: ApplicationStatus;
}

export class ApplicationIntelligenceService {

  /**
   * Record an outcome event when an application status changes.
   * Updates resume performance, keyword performance, and company metrics.
   * Fire-and-forget safe — all errors are caught internally.
   */
  async recordOutcome(event: OutcomeEvent): Promise<void> {
    try {
      const { applicationId, newStatus } = event;

      // Fetch the full application with job and resume
      const [app] = await db
        .select({
          id: applications.id,
          resumeId: applications.resumeId,
          jobId: applications.jobId,
          appliedAt: applications.appliedAt,
          createdAt: applications.createdAt,
          jobSource: jobs.source,
          jobCompany: jobs.company,
          jobCompanyId: jobs.companyId,
          jobTitle: jobs.title,
          jobDescription: jobs.description,
          jobRequirements: jobs.requirements,
        })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!app) return;

      await Promise.allSettled([
        this.updateResumePerformance(app, newStatus),
        this.updateKeywordPerformance(app, newStatus),
        this.updateCompanyMetrics(app, newStatus),
      ]);

    } catch (err) {
      logger.debug({ err, applicationId: event.applicationId }, 'Intelligence recording failed — non-critical');
    }
  }

  /** Recomputes all performance tables from scratch (for cron reconciliation) */
  async recomputeAll(): Promise<{ resumes: number; keywords: number; companies: number }> {
    logger.info('Starting full intelligence recompute');

    const [rCount, kCount, cCount] = await Promise.all([
      this.recomputeResumePerformance(),
      this.recomputeKeywordPerformance(),
      this.recomputeCompanyMetrics(),
    ]);

    logger.info({ resumes: rCount, keywords: kCount, companies: cCount }, 'Intelligence recompute complete');
    return { resumes: rCount, keywords: kCount, companies: cCount };
  }

  // ── Resume Performance ────────────────────────────────────────────────────

  private async updateResumePerformance(app: { resumeId: string; jobSource: string; jobTitle: string }, status: ApplicationStatus): Promise<void> {
    const isSuccess = status === 'applied';
    const isResponse = status === 'interviewing' || status === 'accepted';
    const isInterview = status === 'interviewing';
    const isAccepted = status === 'accepted';

    // Upsert resume_performance row
    await db
      .insert(resumePerformance)
      .values({
        resumeId: app.resumeId,
        totalApplications: 1,
        successCount: isSuccess ? 1 : 0,
        responseCount: isResponse ? 1 : 0,
        interviewCount: isInterview ? 1 : 0,
        acceptedCount: isAccepted ? 1 : 0,
        bestSource: app.jobSource,
        bestJobTitle: app.jobTitle,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: resumePerformance.resumeId,
        set: {
          totalApplications: sql`${resumePerformance.totalApplications} + 1`,
          successCount: isSuccess ? sql`${resumePerformance.successCount} + 1` : resumePerformance.successCount,
          responseCount: isResponse ? sql`${resumePerformance.responseCount} + 1` : resumePerformance.responseCount,
          interviewCount: isInterview ? sql`${resumePerformance.interviewCount} + 1` : resumePerformance.interviewCount,
          acceptedCount: isAccepted ? sql`${resumePerformance.acceptedCount} + 1` : resumePerformance.acceptedCount,
          updatedAt: new Date(),
        },
      });
  }

  private async recomputeResumePerformance(): Promise<number> {
    const stats = await db
      .select({
        resumeId: applications.resumeId,
        total: sql<number>`COUNT(*)`,
        success: sql<number>`SUM(CASE WHEN ${applications.status} = 'applied' THEN 1 ELSE 0 END)`,
        response: sql<number>`SUM(CASE WHEN ${applications.status} IN ('interviewing','accepted') THEN 1 ELSE 0 END)`,
        interview: sql<number>`SUM(CASE WHEN ${applications.status} = 'interviewing' THEN 1 ELSE 0 END)`,
        accepted: sql<number>`SUM(CASE WHEN ${applications.status} = 'accepted' THEN 1 ELSE 0 END)`,
      })
      .from(applications)
      .groupBy(applications.resumeId);

    for (const s of stats) {
      await db
        .insert(resumePerformance)
        .values({
          resumeId: s.resumeId,
          totalApplications: Number(s.total),
          successCount: Number(s.success),
          responseCount: Number(s.response),
          interviewCount: Number(s.interview),
          acceptedCount: Number(s.accepted),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: resumePerformance.resumeId,
          set: {
            totalApplications: Number(s.total),
            successCount: Number(s.success),
            responseCount: Number(s.response),
            interviewCount: Number(s.interview),
            acceptedCount: Number(s.accepted),
            updatedAt: new Date(),
          },
        });
    }

    return stats.length;
  }

  // ── Keyword Performance ───────────────────────────────────────────────────

  private extractKeywords(text: string): string[] {
    // Extract meaningful tech/role keywords (2-30 char, no stop words)
    const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'will', 'you', 'are', 'have', 'from']);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#.]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && w.length <= 30 && !stopWords.has(w) && !/^\d+$/.test(w))
      .slice(0, 40); // limit to top 40 keywords per job
  }

  private async updateKeywordPerformance(
    app: { jobTitle: string; jobDescription: string; jobRequirements: string | null },
    status: ApplicationStatus
  ): Promise<void> {
    const isResponse = status === 'interviewing' || status === 'accepted';
    const text = `${app.jobTitle} ${app.jobDescription} ${app.jobRequirements ?? ''}`;
    const keywords = this.extractKeywords(text);

    for (const keyword of keywords) {
      await db
        .insert(keywordPerformance)
        .values({
          keyword,
          occurrences: 1,
          responseCount: isResponse ? 1 : 0,
          responseRate: isResponse ? 1 : 0,
          lastUpdatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: keywordPerformance.keyword,
          set: {
            occurrences: sql`${keywordPerformance.occurrences} + 1`,
            responseCount: isResponse
              ? sql`${keywordPerformance.responseCount} + 1`
              : keywordPerformance.responseCount,
            // Recompute rate: responseCount / occurrences (after increment)
            responseRate: sql`(${keywordPerformance.responseCount} + ${isResponse ? 1 : 0})::real / (${keywordPerformance.occurrences} + 1)`,
            lastUpdatedAt: new Date(),
          },
        });
    }
  }

  private async recomputeKeywordPerformance(): Promise<number> {
    // This is expensive to fully recompute — log and skip for now
    // Production: use a Postgres materialized view for this
    logger.debug('Keyword performance recompute skipped (use materialized view in production)');
    return 0;
  }

  // ── Company Response Metrics ──────────────────────────────────────────────

  private async updateCompanyMetrics(
    app: { jobCompanyId: string | null; jobCompany: string; appliedAt: Date | null; createdAt: Date | null },
    status: ApplicationStatus
  ): Promise<void> {
    const isResponse = status === 'interviewing' || status === 'accepted';
    const isInterview = status === 'interviewing';

    // Compute response time if we have both timestamps
    let responseDays: number | null = null;
    if (isResponse && (app.appliedAt || app.createdAt)) {
      const from = app.appliedAt ?? app.createdAt!;
      responseDays = (Date.now() - from.getTime()) / (1000 * 60 * 60 * 24);
    }

    await db
      .insert(companyResponseMetrics)
      .values({
        companyId: app.jobCompanyId ?? undefined,
        companyName: app.jobCompany,
        totalApplications: 1,
        responseCount: isResponse ? 1 : 0,
        responseRate: isResponse ? 1 : 0,
        avgResponseDays: responseDays,
        interviewCount: isInterview ? 1 : 0,
        interviewRate: isInterview ? 1 : 0,
        lastUpdatedAt: new Date(),
      })
      .onConflictDoNothing(); // For event updates, rely on recompute for accuracy
  }

  private async recomputeCompanyMetrics(): Promise<number> {
    const stats = await db
      .select({
        companyId: jobs.companyId,
        companyName: jobs.company,
        total: sql<number>`COUNT(*)`,
        responses: sql<number>`SUM(CASE WHEN ${applications.status} IN ('interviewing','accepted') THEN 1 ELSE 0 END)`,
        interviews: sql<number>`SUM(CASE WHEN ${applications.status} = 'interviewing' THEN 1 ELSE 0 END)`,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .groupBy(jobs.companyId, jobs.company);

    for (const s of stats) {
      const total = Number(s.total);
      const responses = Number(s.responses);
      const interviews = Number(s.interviews);

      await db
        .insert(companyResponseMetrics)
        .values({
          companyId: s.companyId ?? undefined,
          companyName: s.companyName,
          totalApplications: total,
          responseCount: responses,
          responseRate: total > 0 ? responses / total : 0,
          interviewCount: interviews,
          interviewRate: total > 0 ? interviews / total : 0,
          lastUpdatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    return stats.length;
  }
}

export const applicationIntelligence = new ApplicationIntelligenceService();
