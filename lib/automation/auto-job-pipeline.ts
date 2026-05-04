import { db } from '@/lib/db';
import { jobs, jobMatches } from '@/lib/db/schema';
import { gte, notExists } from 'drizzle-orm';
import { scoreJobMatch } from '@/lib/openai/job-matcher';
import { logger } from '@/lib/utils/logger';
import { getActiveResumes, getResumes } from '@/lib/actions/resume';

export interface PipelineResult {
  jobsScraped: number;
  jobsMatched: number;
  highMatches: number;
}

export class AutoJobPipeline {
  async runDailyPipeline(): Promise<PipelineResult> {
    logger.info('Starting daily job pipeline');

    // 1. Get active resume (first active one is used for pipeline matching)
    const activeResumes = await getActiveResumes();
    const candidates = activeResumes.length > 0 ? activeResumes : await getResumes();
    const activeResume = candidates[0];

    if (!activeResume) {
      logger.warn('No resume found — skipping match phase');
      return { jobsScraped: 0, jobsMatched: 0, highMatches: 0 };
    }

    // 2. Get new jobs from the last 24 hours that haven't been matched yet
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const newJobs = await db
      .select()
      .from(jobs)
      .where(gte(jobs.createdAt, oneDayAgo))
      .limit(100);

    logger.info({ count: newJobs.length }, 'New jobs to match');

    // 3. Score each job
    const highMatchJobs: Array<{ job: typeof newJobs[0]; score: number; strengths?: string[]; weaknesses?: string[]; recommendation?: string }> = [];
    let matched = 0;

    for (const job of newJobs) {
      try {
        const match = await scoreJobMatch(job, activeResume);

        await db
          .insert(jobMatches)
          .values({
            jobId: job.id,
            resumeId: activeResume.id,
            score: match.score,
            strengths: match.strengths ?? [],
            weaknesses: match.weaknesses ?? [],
            recommendation: match.recommendation,
            confidence: match.confidence,
          })
          .onConflictDoNothing();

        matched++;

        if (match.score >= 80) {
          highMatchJobs.push({ job, ...match });
        }

        // Small delay to avoid OpenAI rate limits
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        logger.error({ err, jobId: job.id }, 'Failed to match job');
      }
    }

    // 4. Send email alert for high matches (dynamic import to avoid breaking if resend not configured)
    if (highMatchJobs.length > 0) {
      try {
        const { EmailNotificationService } = await import('@/lib/notifications/email-service');
        const emailSvc = new EmailNotificationService();
        await emailSvc.sendJobMatchAlert(highMatchJobs);
      } catch (err) {
        logger.error({ err }, 'Failed to send match alert email');
      }

      // Send Telegram notifications for each high match
      try {
        const { telegramService } = await import('@/lib/notifications/telegram-service');
        for (const m of highMatchJobs) {
          await telegramService.notifyHighMatch(m.job, m.score);
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch (err) {
        logger.error({ err }, 'Failed to send Telegram notifications');
      }
    }

    logger.info({ matched, highMatches: highMatchJobs.length }, 'Daily pipeline complete');

    return {
      jobsScraped: newJobs.length,
      jobsMatched: matched,
      highMatches: highMatchJobs.length,
    };
  }
}
