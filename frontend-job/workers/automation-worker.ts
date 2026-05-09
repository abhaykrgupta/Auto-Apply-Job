/**
 * Automation Worker — Playwright execution process
 *
 * Handles: apply_job
 *
 * Run:  npx tsx workers/automation-worker.ts
 *
 * This process owns the Playwright browser instance and all DOM interaction.
 * Keeping it separate from Next.js prevents browser crashes from affecting
 * the web server.
 */
// Env loaded by --env-file=.env.local at Node startup (see package.json scripts)
import { createWorker } from '@/lib/workers/worker-bootstrap';
import { applyToJob } from '@/lib/automation/apply-engine';
import { warmSession } from '@/lib/automation/session-warmer';
import { getBrowser } from '@/lib/automation/playwright-client';
import { logger } from '@/lib/utils/logger';
import { extractDomain } from '@/lib/scrapers/dom-fingerprint';
import type { ApplyJobPayload, ApplyJobResult } from '@/lib/workers/task-types';
import type { WorkerTask } from '@/lib/workers/task-types';

const worker = createWorker('automation', ['apply_job']);

worker.register('apply_job', async (task: WorkerTask<'apply_job'>, signal: AbortSignal): Promise<ApplyJobResult> => {
  const payload = task.payload as ApplyJobPayload;
  const { applicationId, job, resume, options = {} } = payload;

  logger.info({ applicationId, jobTitle: job.title, company: job.company }, '[automation] Starting apply_job');

  // Optional session warming before automation begins
  if (options.warmSession && process.env.SESSION_WARMING !== 'false') {
    try {
      const domain = extractDomain(job.applyUrl);
      const browser = await getBrowser();
      const warmPage = await browser.newPage();
      await warmPage.goto(job.applyUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await warmSession(warmPage, domain);
      await warmPage.close();
      logger.info({ domain }, '[automation] Session warming complete');
    } catch (err) {
      logger.warn({ err }, '[automation] Session warming failed — continuing without it');
    }
  }

  if (signal.aborted) {
    throw new Error('Task aborted during session warming');
  }

  const result = await applyToJob(applicationId, job, resume, options);
  return result;
});

worker.start().catch((err) => {
  logger.error({ err }, '[automation] Worker crashed');
  process.exit(1);
});
