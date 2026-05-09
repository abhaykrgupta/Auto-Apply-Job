/**
 * AI Worker — GPT/embeddings execution process
 *
 * Handles: match_jobs, tailor_resume, generate_cover_letter, parse_resume
 *
 * Run:  npx tsx workers/ai-worker.ts
 *
 * Isolates expensive OpenAI calls from the web runtime.
 * The rate limiter runs per-process, keeping this worker's quota separate.
 */
// Env loaded by --env-file=.env.local at Node startup (see package.json scripts)
import { createWorker } from '@/lib/workers/worker-bootstrap';
import { scoreJobMatch } from '@/lib/openai/job-matcher';
import { tailorResumeToJob } from '@/lib/openai/resume-tailor';
import { db } from '@/lib/db';
import { jobs, resumes, jobMatches } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import type {
  MatchJobsPayload, TailorResumePayload,
  MatchJobsResult, TailorResumeResult,
  WorkerTask,
} from '@/lib/workers/task-types';

const worker = createWorker('ai', ['match_jobs', 'tailor_resume', 'generate_cover_letter', 'parse_resume']);

worker.register('match_jobs', async (task: WorkerTask<'match_jobs'>): Promise<MatchJobsResult> => {
  const payload = task.payload as MatchJobsPayload;
  logger.info({ resumeId: payload.resumeId }, '[ai] Starting match_jobs');

  const [resume] = await db.select().from(resumes).where(eq(resumes.id, payload.resumeId)).limit(1);
  if (!resume?.parsedData) throw new Error('Resume not found or has no parsed data');

  const jobList = payload.jobIds?.length
    ? await db.select().from(jobs).where(eq(jobs.status, 'active'))
    : await db.select().from(jobs).where(eq(jobs.status, 'active')).limit(100);

  let matched = 0;
  let highMatches = 0;
  const threshold = payload.threshold ?? 70;

  for (const job of jobList) {
    try {
      const result = await scoreJobMatch(
        {
          company: job.company,
          title: job.title,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
        },
        resume.parsedData as Record<string, unknown>
      );

      await db.insert(jobMatches).values({
        jobId: job.id,
        resumeId: resume.id,
        score: result.score,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendation: result.recommendation,
        confidence: result.confidence,
        reasoning: result.reasoning,
      }).onConflictDoNothing();

      matched++;
      if (result.score >= threshold) highMatches++;
    } catch (err) {
      logger.warn({ err, jobId: job.id }, '[ai] Failed to score job — skipping');
    }
  }

  return { matched, highMatches };
});

worker.register('tailor_resume', async (task: WorkerTask<'tailor_resume'>): Promise<TailorResumeResult> => {
  const payload = task.payload as TailorResumePayload;
  logger.info({ resumeId: payload.resumeId, jobId: payload.jobId }, '[ai] Starting tailor_resume');

  const [[resume], [job]] = await Promise.all([
    db.select().from(resumes).where(eq(resumes.id, payload.resumeId)).limit(1),
    db.select().from(jobs).where(eq(jobs.id, payload.jobId)).limit(1),
  ]);

  if (!resume?.parsedData) throw new Error('Resume not found');
  if (!job) throw new Error('Job not found');

  const result = await tailorResumeToJob(resume.parsedData, {
    title: job.title,
    company: job.company,
    description: job.description,
    requirements: job.requirements,
  });

  return { tailored: true, matchBoost: result.matchBoost };
});

worker.register('generate_cover_letter', async (task: WorkerTask<'generate_cover_letter'>) => {
  const { generateCoverLetter } = await import('@/lib/openai/content-generator') as any;
  const { resumeId, jobId } = task.payload as { resumeId: string; jobId: string };
  const [[resume], [job]] = await Promise.all([
    db.select().from(resumes).where(eq(resumes.id, resumeId)).limit(1),
    db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1),
  ]);
  if (!resume?.parsedData || !job) throw new Error('Resume or job not found');
  const letter = await generateCoverLetter(job, resume.parsedData as Record<string, unknown>);
  return { coverLetter: letter };
});

worker.register('parse_resume', async (task: WorkerTask<'parse_resume'>) => {
  const { parseResume } = await import('@/lib/openai/resume-parser') as any;
  const { resumeId, filePath } = task.payload as { resumeId: string; filePath: string };
  const { readFile } = await import('node:fs/promises');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
  const buffer = await readFile(filePath);
  const { text } = await pdfParse(buffer);
  const parsed = await parseResume(text);
  await db.update(resumes).set({ parsedData: parsed }).where(eq(resumes.id, resumeId));
  return { parsed: true };
});

worker.start().catch((err) => {
  logger.error({ err }, '[ai] Worker crashed');
  process.exit(1);
});
