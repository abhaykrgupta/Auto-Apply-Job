import { db } from '@/lib/db';
import { applications, jobs, resumes } from '@/lib/db/schema';
import { eq, and, lt, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export class RetryEngine {
  async retryFailedApplications(): Promise<{ retried: number; succeeded: number }> {
    logger.info('Starting auto-retry for failed applications');

    // Get failed apps from last 48h with fewer than 3 attempts
    const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const failedApps = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        resumeId: applications.resumeId,
        attemptCount: applications.attemptCount,
      })
      .from(applications)
      .where(
        and(
          eq(applications.status, 'failed'),
          lte(applications.attemptCount, 2),
          gte(applications.createdAt, yesterday)
        )
      )
      .limit(20);

    logger.info({ count: failedApps.length }, 'Applications to retry');

    let succeeded = 0;

    for (const app of failedApps) {
      try {
        // Fetch the job for this application
        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, app.jobId))
          .limit(1);

        if (!job) continue;

        // Mark as pending again so the apply pipeline can pick it up
        await db
          .update(applications)
          .set({
            status: 'pending',
            attemptCount: (app.attemptCount ?? 0) + 1,
            lastAttemptAt: new Date(),
            errorMessage: null,
            updatedAt: new Date(),
          })
          .where(eq(applications.id, app.id));

        succeeded++;
        logger.info({ appId: app.id, job: job.title }, 'Queued for retry');

        // Small delay between DB writes
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        logger.error({ err, appId: app.id }, 'Retry update failed');
      }
    }

    logger.info({ retried: failedApps.length, succeeded }, 'Auto-retry complete');
    return { retried: failedApps.length, succeeded };
  }
}
