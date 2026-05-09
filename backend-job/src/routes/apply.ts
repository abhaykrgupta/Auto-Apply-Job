import { FastifyInstance } from 'fastify';
import { applyQueue } from '../queue';
import { db } from '../../lib/db';
import { applications, jobs, resumes, jobMatches, settings } from '../../lib/db/schema';
import { eq, and, gte, inArray } from 'drizzle-orm';

export default async function applyRoutes(server: FastifyInstance) {

  // Single job apply — enqueue to BullMQ
  server.post<{ Params: { id: string }; Body: { resumeId?: string } }>(
    '/api/jobs/:id/apply',
    async (request, reply) => {
      try {
        const { id: jobId } = request.params;
        const { resumeId } = request.body || {};

        // Fetch job
        const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
        if (!job) return reply.status(404).send({ error: 'Job not found' });

        // Find resume
        let resume;
        if (resumeId) {
          [resume] = await db.select().from(resumes).where(eq(resumes.id, resumeId)).limit(1);
        } else {
          // Get first active resume
          [resume] = await db.select().from(resumes).where(eq(resumes.isActive, true)).limit(1);
          if (!resume) {
            [resume] = await db.select().from(resumes).limit(1);
          }
        }

        if (!resume) return reply.status(400).send({ error: 'No resume found. Upload a resume first.' });

        // Check if already applied
        const [existing] = await db.select({ id: applications.id })
          .from(applications)
          .where(and(eq(applications.jobId, jobId), eq(applications.resumeId, resume.id)))
          .limit(1);

        if (existing) return reply.status(409).send({ error: 'Already applied to this job.' });

        // Create application record as "pending"
        const [application] = await db.insert(applications).values({
          jobId,
          resumeId: resume.id,
          status: 'pending',
          method: 'auto',
          attemptCount: 0,
        }).returning();

        // Add a log entry
        const { applicationLogs } = await import('../../lib/db/schema');
        await db.insert(applicationLogs).values({
          applicationId: application.id,
          level: 'info',
          message: 'Application created, queued for processing.',
        });

        // Enqueue to BullMQ for background processing
        await applyQueue.add(
          `apply-${jobId}`,
          {
            applicationId: application.id,
            jobId: job.id,
            resumeId: resume.id,
            applyUrl: job.applyUrl,
            jobTitle: job.title,
            company: job.company,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 60000 }, // 1min, 2min, 4min
            removeOnComplete: 100,
            removeOnFail: 200,
          }
        );

        server.log.info(`[Apply] Queued application ${application.id} for job "${job.title}" at ${job.company}`);

        return {
          applicationId: application.id,
          resumeLabel: resume.label ?? resume.fileName,
          status: 'queued',
          message: `Application queued for "${job.title}" at ${job.company}`,
        };
      } catch (err) {
        server.log.error('[Apply Single] ' + err);
        reply.status(500).send({ error: 'Failed to queue application' });
      }
    }
  );

  // Bulk apply — enqueue multiple jobs to BullMQ
  server.post<{ Body: { resumeId: string; minMatchScore?: number } }>(
    '/api/jobs/bulk-apply',
    async (request, reply) => {
      try {
        const { resumeId, minMatchScore: overrideScore } = request.body || {};

        if (!resumeId) return reply.status(400).send({ error: 'resumeId is required' });

        const [resume] = await db.select().from(resumes).where(eq(resumes.id, resumeId)).limit(1);
        if (!resume) return reply.status(404).send({ error: 'Resume not found' });

        // Get minMatchScore from settings if not provided
        let minScore = overrideScore;
        if (!minScore) {
          const [setting] = await db.select().from(settings).where(eq(settings.key, 'minMatchScore')).limit(1);
          minScore = setting ? Number(setting.value) : 70;
        }

        // Find all matches meeting the threshold
        const matches = await db
          .select({
            jobId: jobs.id,
            title: jobs.title,
            company: jobs.company,
            applyUrl: jobs.applyUrl,
            score: jobMatches.score,
          })
          .from(jobMatches)
          .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
          .where(
            and(
              eq(jobMatches.resumeId, resumeId),
              gte(jobMatches.score, minScore),
              eq(jobs.status, 'active')
            )
          );

        if (matches.length === 0) {
          return { queued: 0, message: 'No jobs meet the minimum match score threshold.' };
        }

        // Filter out already-applied jobs
        const existingApps = await db
          .select({ jobId: applications.jobId })
          .from(applications)
          .where(eq(applications.resumeId, resumeId));

        const appliedJobIds = new Set(existingApps.map(a => a.jobId));
        const jobsToApply = matches.filter(m => !appliedJobIds.has(m.jobId));

        if (jobsToApply.length === 0) {
          return { queued: 0, message: 'Already applied to all matching jobs.' };
        }

        // Create application records and enqueue all
        let queued = 0;
        for (const job of jobsToApply) {
          const [application] = await db.insert(applications).values({
            jobId: job.jobId,
            resumeId: resume.id,
            status: 'pending',
            method: 'auto',
            attemptCount: 0,
          }).returning();

          await applyQueue.add(
            `apply-${job.jobId}`,
            {
              applicationId: application.id,
              jobId: job.jobId,
              resumeId: resume.id,
              applyUrl: job.applyUrl,
              jobTitle: job.title,
              company: job.company,
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 60000 },
              removeOnComplete: 100,
              removeOnFail: 200,
            }
          );
          queued++;
        }

        server.log.info(`[Bulk Apply] Queued ${queued} applications`);
        return { queued, message: `Successfully queued ${queued} jobs for auto-apply.` };
      } catch (err) {
        server.log.error('[Apply Bulk] ' + err);
        reply.status(500).send({ error: 'Bulk apply failed' });
      }
    }
  );

  // Get queue status
  server.get('/api/queue/status', async (request, reply) => {
    try {
      const waiting = await applyQueue.getWaitingCount();
      const active = await applyQueue.getActiveCount();
      const completed = await applyQueue.getCompletedCount();
      const failed = await applyQueue.getFailedCount();
      const delayed = await applyQueue.getDelayedCount();

      return { waiting, active, completed, failed, delayed };
    } catch (err) {
      server.log.error('[Queue Status] ' + err);
      reply.status(500).send({ error: 'Failed to get queue status' });
    }
  });
}
