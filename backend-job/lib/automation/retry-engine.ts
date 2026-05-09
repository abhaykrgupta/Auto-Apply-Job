import { db } from '@/lib/db';
import { applications, jobs } from '@/lib/db/schema';
import { eq, and, lte, gte, isNull, or } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { isRetryable } from './retry-classifier';

/**
 * Intelligent Retry Engine
 *
 * Replaces the naive "retry everything failed" approach with classified retry logic:
 *  - Only retryable failure types are re-queued
 *  - Cooldown timestamps are respected (no premature retries)
 *  - Non-retryable failures (CAPTCHA, banned, invalid URL) are permanently skipped
 *  - Per-failure-type limits prevent endless retry loops
 */
export class RetryEngine {
  async retryFailedApplications(): Promise<{ eligible: number; retried: number; skipped: number }> {
    logger.info('Starting intelligent retry scan');

    const window48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const now = new Date();

    // Fetch failed apps from last 48h with fewer than 3 attempts
    const failedApps = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        attemptCount: applications.attemptCount,
        lastFailureType: applications.lastFailureType,
        cooldownUntil: applications.cooldownUntil,
        errorMessage: applications.errorMessage,
      })
      .from(applications)
      .where(
        and(
          eq(applications.status, 'failed'),
          lte(applications.attemptCount, 2),
          gte(applications.createdAt, window48h)
        )
      )
      .limit(20);

    logger.info({ count: failedApps.length }, 'Failed applications found for retry evaluation');

    let retried = 0;
    let skipped = 0;

    for (const app of failedApps) {
      // ── Non-retryable failure types — permanently skip ───────────────────
      const failureType = (app.lastFailureType ?? 'unknown') as Parameters<typeof isRetryable>[0];
      if (!isRetryable(failureType)) {
        logger.info({ appId: app.id, failureType }, 'Skipping non-retryable failure');
        skipped++;
        continue;
      }

      // ── Cooldown not expired yet — skip ──────────────────────────────────
      if (app.cooldownUntil && app.cooldownUntil > now) {
        const remaining = Math.round((app.cooldownUntil.getTime() - now.getTime()) / 1000);
        logger.debug({ appId: app.id, failureType, remainingSeconds: remaining }, 'Cooldown active — skipping');
        skipped++;
        continue;
      }

      // ── Re-queue as pending ───────────────────────────────────────────────
      try {
        await db
          .update(applications)
          .set({
            status: 'pending',
            attemptCount: (app.attemptCount ?? 0) + 1,
            lastAttemptAt: new Date(),
            errorMessage: null,
            cooldownUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(applications.id, app.id));

        retried++;
        logger.info({ appId: app.id, failureType, attempt: (app.attemptCount ?? 0) + 1 }, 'Re-queued for retry');

        // Tiny delay between DB writes
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        logger.error({ err, appId: app.id }, 'Failed to update retry status');
      }
    }

    logger.info({ eligible: failedApps.length, retried, skipped }, 'Intelligent retry complete');
    return { eligible: failedApps.length, retried, skipped };
  }
}
