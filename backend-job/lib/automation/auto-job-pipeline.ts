import { db } from '@/lib/db';
import { jobs, jobMatches, applications, settings } from '@/lib/db/schema';
import { gte, inArray, eq } from 'drizzle-orm';
import { scoreJobMatch } from '@/lib/openai/job-matcher';
import { applyToJob } from '@/lib/automation/apply-engine';
import { logger } from '@/lib/utils/logger';
import { getActiveResumes, getResumes } from '@/lib/actions/resume';

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
    if (row.length > 0 && row[0].value !== null) return row[0].value as T;
  } catch {}
  return fallback;
}

export interface PipelineResult {
  jobsScraped: number;
  jobsMatched: number;
  highMatches: number;
  jobsApplied: number;
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
      return { jobsScraped: 0, jobsMatched: 0, highMatches: 0, jobsApplied: 0 };
    }

    // 2. Get new jobs from the last 24 hours that haven't been matched yet
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const newJobs = await db
      .select()
      .from(jobs)
      .where(gte(jobs.createdAt, oneDayAgo))
      .limit(100);

    logger.info({ count: newJobs.length }, 'New jobs to match');

    // 3. Read settings from DB (user controls these from the Settings page)
    const autoApplyEnabled = await getSetting<boolean>('autoApplyEnabled', false);
    const minMatchScore = await getSetting<number>('minMatchScore', 80);

    // 4. Score each job
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

        if (match.score >= minMatchScore) {
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

    // 5. Auto-apply to high matches (only if user opted in via Settings page)
    let jobsApplied = 0;

    if (autoApplyEnabled && highMatchJobs.length > 0) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const candidateJobs = highMatchJobs.filter((m) => {
        const postedAt = m.job.postedAt;
        return !postedAt || new Date(postedAt) >= threeDaysAgo;
      });

      // Find which jobs already have an application record
      const candidateJobIds = candidateJobs.map((m) => m.job.id);
      const existingApps = candidateJobIds.length > 0
        ? await db
            .select({ jobId: applications.jobId })
            .from(applications)
            .where(inArray(applications.jobId, candidateJobIds))
        : [];
      const alreadyAppliedIds = new Set(existingApps.map((a) => a.jobId));

      const toApply = candidateJobs
        .filter((m) => !alreadyAppliedIds.has(m.job.id))
        .slice(0, 10); // hard safety cap — never more than 10 per run

      for (const { job } of toApply) {
        try {
          // Create application record first to get an ID
          const [newApp] = await db
            .insert(applications)
            .values({
              jobId: job.id,
              resumeId: activeResume.id,
              status: 'pending',
              method: 'auto',
            })
            .returning({ id: applications.id });

          const result = await applyToJob(
            newApp.id,
            {
              id: job.id,
              title: job.title,
              company: job.company,
              description: job.description,
              applyUrl: job.applyUrl,
              requirements: job.requirements ?? null,
            },
            {
              id: activeResume.id,
              filePath: (activeResume as { filePath?: string }).filePath ?? '',
              parsedData: (activeResume.parsedData as Record<string, unknown>) ?? null,
            }
          );

          if (result.status === 'applied') jobsApplied++;

          logger.info({ jobId: job.id, title: job.title, status: result.status }, 'Auto-apply result');
        } catch (err) {
          logger.error({ err, jobId: job.id }, 'Auto-apply failed');
        }

        // 30s delay between applications — parallel applies get flagged as bots
        await new Promise((r) => setTimeout(r, 30_000));
      }
    } else if (!autoApplyEnabled) {
      logger.info({ highMatches: highMatchJobs.length }, 'Auto-apply disabled in settings — skipping applications');
    }

    logger.info({ matched, highMatches: highMatchJobs.length, jobsApplied }, 'Daily pipeline complete');

    return {
      jobsScraped: newJobs.length,
      jobsMatched: matched,
      highMatches: highMatchJobs.length,
      jobsApplied,
    };
  }
}
