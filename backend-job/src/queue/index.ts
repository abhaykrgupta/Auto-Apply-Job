import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { applyToJob } from '../../lib/automation/apply-engine';
import { runAutoDiscovery } from '../../lib/company-discovery/auto-discovery-engine';
import { db } from '../../lib/db';
import { applications, applicationLogs } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

// Connection to Redis
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// Create Queues
export const applyQueue = new Queue('apply-queue', { connection });
export const discoverQueue = new Queue('discover-queue', { connection });

// Initialize Workers
export function initializeWorkers() {
  let applicationsProcessed = 0;
  const MAX_APPLICATIONS_BEFORE_RESTART = 50;

  const applyWorker = new Worker(
    'apply-queue',
    async (job) => {
      const { applicationId, jobId, resumeId, applyUrl, jobTitle, company } = job.data;
      console.log(`[Worker] Processing application ${applicationId} for "${jobTitle}" at ${company}`);

      // Log the start
      await db.insert(applicationLogs).values({
        applicationId,
        level: 'info',
        message: `Bot started processing. Attempt ${(job.attemptsMade || 0) + 1}. Navigating to ${applyUrl}`,
      });

      // Fetch full job and resume data from DB so the engine has everything it needs
      const { jobs, resumes } = await import('../../lib/db/schema');
      const [fullJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      const [fullResume] = await db.select().from(resumes).where(eq(resumes.id, resumeId)).limit(1);

      if (!fullJob || !fullResume) {
        throw new Error(`Job or Resume not found in DB (jobId: ${jobId}, resumeId: ${resumeId})`);
      }

      try {
        // Call the actual apply engine — it handles its OWN status updates internally
        const result = await applyToJob(
          applicationId, 
          {
            id: fullJob.id,
            title: fullJob.title,
            company: fullJob.company,
            description: fullJob.description,
            applyUrl: fullJob.applyUrl,
            requirements: fullJob.requirements,
          },
          {
            id: fullResume.id,
            filePath: fullResume.filePath,
            parsedData: fullResume.parsedData as Record<string, unknown> | null,
          }
        );

        // Log the result (DO NOT override status — engine already set it correctly)
        await db.insert(applicationLogs).values({
          applicationId,
          level: result.status === 'applied' ? 'info' : 'warn',
          message: result.status === 'applied'
            ? `Successfully applied to "${jobTitle}" at ${company}.`
            : `Engine returned status: ${result.status}. ${result.error || ''}`,
        });

        console.log(`[Worker] Application ${applicationId} result: ${result.status}`);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        
        // Log the error
        await db.insert(applicationLogs).values({
          applicationId,
          level: 'error',
          message: `Application failed: ${errorMsg}`,
        });

        // The engine's catch block already sets status to 'failed' in the DB,
        // but if the error happened BEFORE the engine ran, we need to set it here
        if ((job.attemptsMade || 0) + 1 >= (job.opts?.attempts || 3)) {
          await db.update(applications)
            .set({ 
              status: 'failed', 
              errorMessage: errorMsg,
              lastFailureType: 'automation_error',
            })
            .where(eq(applications.id, applicationId));
        }

        throw err; // Re-throw so BullMQ handles retry
      }

      applicationsProcessed++;
      if (applicationsProcessed >= MAX_APPLICATIONS_BEFORE_RESTART) {
        console.log(`[Worker] Reached ${MAX_APPLICATIONS_BEFORE_RESTART} applications. Scheduling restart.`);
        setTimeout(() => process.exit(0), 2000);
      }
    },
    { 
      connection, 
      concurrency: 2, // Only 2 concurrent browser automations
      limiter: {
        max: 1,
        duration: 90000, // Max 1 application per 90 seconds (anti-detection)
      }
    }
  );

  const discoverWorker = new Worker(
    'discover-queue',
    async (job) => {
      console.log(`[Worker] Running discovery for source: ${job.data.source}`);
      await runAutoDiscovery([job.data.source]);
    },
    { connection, concurrency: 2 }
  );

  applyWorker.on('completed', (job) => {
    console.log(`[Worker] ✅ Application ${job.id} completed successfully`);
  });
  
  applyWorker.on('failed', (job, err) => {
    console.log(`[Worker] ❌ Application ${job?.id} failed: ${err.message}`);
  });

  applyWorker.on('error', (err) => {
    console.error(`[Worker] Worker error: ${err.message}`);
  });

  discoverWorker.on('completed', (job) => console.log(`[Worker] Discovery ${job.id} completed`));
  discoverWorker.on('failed', (job, err) => console.log(`[Worker] Discovery ${job?.id} failed: ${err.message}`));

  console.log('[Queue] ✅ Workers initialized successfully. Listening for jobs...');
}
