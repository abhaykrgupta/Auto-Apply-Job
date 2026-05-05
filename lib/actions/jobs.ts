'use server';

import { db } from '@/lib/db';
import { jobs, jobMatches, resumes } from '@/lib/db/schema';
import { scoreJobMatch } from '@/lib/openai/job-matcher';
import { getEmbedding } from '@/lib/openai/embeddings';
import { eq, desc, and, gte, ilike } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getJobs(filters?: { status?: string; source?: string }) {
  const query = db.select().from(jobs).orderBy(desc(jobs.createdAt));
  return query;
}

export async function getJobById(id: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  return job;
}

export async function matchJobsToResume(resumeId: string) {
  const [resume] = await db.select().from(resumes).where(eq(resumes.id, resumeId));
  if (!resume?.parsedData) throw new Error('Resume not found or not parsed');

  const allJobs = await db.select().from(jobs).where(eq(jobs.status, 'active')).limit(50);

  const results = [];
  for (const job of allJobs) {
    try {
      let jobEmbedding = job.jobEmbedding;
      if (!jobEmbedding) {
        jobEmbedding = await getEmbedding(`${job.title} ${job.description} ${job.requirements ?? ''}`);
        await db.update(jobs).set({ jobEmbedding }).where(eq(jobs.id, job.id));
      }

      const matchResult = await scoreJobMatch(
        {
          company: job.company,
          title: job.title,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
        },
        resume.parsedData as Record<string, unknown>
      );

      const [match] = await db
        .insert(jobMatches)
        .values({
          jobId: job.id,
          resumeId,
          score: matchResult.score,
          strengths: matchResult.strengths,
          weaknesses: matchResult.weaknesses,
          recommendation: matchResult.recommendation,
          confidence: matchResult.confidence,
          reasoning: matchResult.reasoning,
        })
        .onConflictDoNothing()
        .returning();

      results.push(match);
    } catch {
      // Skip failed matches
    }
  }

  revalidatePath('/matches');
  return results;
}

export async function getJobMatches(resumeId: string) {
  return db
    .select({
      match: jobMatches,
      job: jobs,
    })
    .from(jobMatches)
    .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
    .where(eq(jobMatches.resumeId, resumeId))
    .orderBy(desc(jobMatches.score));
}
