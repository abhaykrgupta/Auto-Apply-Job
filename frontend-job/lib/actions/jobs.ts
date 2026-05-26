'use server';

import { db } from '@/lib/db';
import { jobs, jobMatches, resumes, applications } from '@/lib/db/schema';
import { getEmbedding } from '@/lib/openai/embeddings';
import { openai } from '@/lib/openai/client';
import { rateLimitedOpenAI } from '@/lib/openai/rate-limiter';
import { eq, desc, and, isNotNull, isNull, lt, sql, inArray, ilike, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getJobs(filters?: { status?: string; source?: string }) {
  return db.select().from(jobs).orderBy(desc(jobs.createdAt));
}

export async function getJobById(id: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  return job;
}

// ─────────────────────────────────────────────────────────────────────────────
// User-controlled match filters
// ─────────────────────────────────────────────────────────────────────────────
export interface MatchFilters {
  role?:       string;   // e.g. "Software Engineer"
  location?:   string;   // e.g. "India", "Remote"
  remote?:     'any' | 'remote' | 'onsite' | 'hybrid';
  experience?: 'any' | 'fresher' | '1-2' | '2-3' | '3-5' | '5-7' | 'senior';
  datePosted?: 'any' | '1d' | '3d' | '7d' | '30d';
}

// ─────────────────────────────────────────────────────────────────────────────
// matchJobsToResume — user controls exactly which jobs get scored
//   1. Apply user filters FIRST (role, location, remote, exp, date)
//   2. Embedding pre-filter: pgvector cosine similarity → top 200 candidates
//   3. Cache: skip jobs scored < 24h ago
//   4. Feedback context: inject historical signal into GPT prompt
//   5. Batch scoring: 5 jobs per GPT call (5× faster)
// ─────────────────────────────────────────────────────────────────────────────
export async function matchJobsToResume(resumeId: string, filters: MatchFilters = {}) {
  const [resume] = await db.select().from(resumes).where(eq(resumes.id, resumeId));
  if (!resume?.parsedData) throw new Error('Resume not found or not parsed');

  const resumeData = resume.parsedData as Record<string, unknown>;

  // ── Step 1: build WHERE conditions from user filters ──────────────────────
  const conditions: ReturnType<typeof eq>[] = [eq(jobs.status, 'active') as any];

  // Role: match title OR description (broad — catches "Full Stack" when user types "Software Engineer")
  if (filters.role?.trim()) {
    const rolePat = `%${filters.role.trim()}%`;
    conditions.push(or(ilike(jobs.title, rolePat), ilike(jobs.description, rolePat)) as any);
  }

  // Location: match location field
  if (filters.location?.trim()) {
    const locPat = `%${filters.location.trim()}%`;
    conditions.push(ilike(jobs.location, locPat) as any);
  }

  // Remote preference
  if (filters.remote && filters.remote !== 'any') {
    if (filters.remote === 'remote') {
      conditions.push(or(
        ilike(jobs.location, '%remote%'),
        ilike(jobs.title, '%remote%'),
        eq(jobs.locationType, 'remote'),
      ) as any);
    } else if (filters.remote === 'hybrid') {
      conditions.push(or(
        ilike(jobs.location, '%hybrid%'),
        eq(jobs.locationType, 'hybrid'),
      ) as any);
    } else if (filters.remote === 'onsite') {
      conditions.push(eq(jobs.locationType, 'onsite') as any);
    }
  }

  // Experience level: filter by seniority keywords in title
  if (filters.experience && filters.experience !== 'any') {
    const exp = filters.experience;
    if (exp === 'senior') {
      conditions.push(or(
        ilike(jobs.title, '%senior%'), ilike(jobs.title, '%lead%'),
        ilike(jobs.title, '%staff%'),  ilike(jobs.title, '%principal%'),
      ) as any);
    } else if (exp === 'fresher') {
      conditions.push(or(
        ilike(jobs.title, '%junior%'),  ilike(jobs.title, '%entry%'),
        ilike(jobs.title, '%graduate%'), ilike(jobs.title, '%intern%'),
        ilike(jobs.title, '%associate%'),
      ) as any);
    }
    // For mid-level (1-2, 2-3, 3-5, 5-7): exclude obvious senior/junior titles
    if (['1-2', '2-3'].includes(exp)) {
      conditions.push(sql`(
        jobs.title NOT ILIKE '%senior%' AND jobs.title NOT ILIKE '%staff%'
        AND jobs.title NOT ILIKE '%principal%' AND jobs.title NOT ILIKE '%intern%'
      )` as any);
    }
  }

  // Date posted filter
  if (filters.datePosted && filters.datePosted !== 'any') {
    const days = filters.datePosted === '1d' ? 1 : filters.datePosted === '3d' ? 3
      : filters.datePosted === '7d' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    conditions.push(sql`(jobs.posted_at IS NULL OR jobs.posted_at >= ${since})` as any);
  }

  const whereClause = and(...conditions);

  // ── Step 2: build resume embedding (once) ─────────────────────────────────
  const resumeText = buildResumeText(resumeData);
  const resumeEmbedding = await getEmbedding(resumeText);
  const resumeVecStr = `[${resumeEmbedding.join(',')}]`;

  // ── Step 3: embedding pre-filter — top 200 by cosine similarity ───────────
  const withEmbedding = await db
    .select()
    .from(jobs)
    .where(and(whereClause as any, isNotNull(jobs.jobEmbedding)))
    .orderBy(sql`job_embedding <=> ${resumeVecStr}::vector`)
    .limit(200);

  // Jobs without embeddings yet — compute & store them
  const withoutEmbedding = await db
    .select()
    .from(jobs)
    .where(and(whereClause as any, isNull(jobs.jobEmbedding)))
    .limit(100);

  // Compute missing embeddings — batches of 20 to respect rate limits,
  // then fire all DB writes concurrently at the end (no N+1 sequential writes)
  if (withoutEmbedding.length) {
    const embeddingMap = new Map<string, number[]>();
    const BATCH = 20;
    for (let i = 0; i < withoutEmbedding.length; i += BATCH) {
      const results = await Promise.allSettled(
        withoutEmbedding.slice(i, i + BATCH).map(async (job) => {
          const emb = await getEmbedding(
            `${job.title} ${job.description} ${job.requirements ?? ''}`
          );
          return { id: job.id, emb };
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') embeddingMap.set(r.value.id, r.value.emb);
      }
    }
    // Apply to in-memory objects so pgvector sort below sees them
    for (const job of withoutEmbedding) {
      const emb = embeddingMap.get(job.id);
      if (emb) job.jobEmbedding = emb;
    }
    // Write all embeddings to DB concurrently (not sequentially)
    await Promise.allSettled(
      [...embeddingMap.entries()].map(([id, emb]) =>
        db.update(jobs).set({ jobEmbedding: emb }).where(eq(jobs.id, id))
      )
    );
  }

  const candidateJobs = [...withEmbedding, ...withoutEmbedding];

  // ── Step 3: cache filter — skip jobs scored in last 24h ───────────────────
  const cacheThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingMatches = await db
    .select({ jobId: jobMatches.jobId, scoredAt: jobMatches.scoredAt })
    .from(jobMatches)
    .where(eq(jobMatches.resumeId, resumeId));

  const freshJobIds = new Set(
    existingMatches
      .filter(m => m.scoredAt && m.scoredAt > cacheThreshold)
      .map(m => m.jobId)
  );

  const toScore = candidateJobs.filter(j => !freshJobIds.has(j.id));

  if (!toScore.length) {
    revalidatePath('/matches');
    return { scored: 0, cached: candidateJobs.length, message: 'All jobs already scored within 24h' };
  }

  // ── Step 4: load feedback signals to inject into GPT context ─────────────
  const feedbackRows = await db
    .select({ score: jobMatches.score, feedbackSignal: jobMatches.feedbackSignal })
    .from(jobMatches)
    .where(and(eq(jobMatches.resumeId, resumeId), isNotNull(jobMatches.feedbackSignal)));

  const feedbackContext = buildFeedbackContext(feedbackRows);

  // ── Step 5: batch score 5 jobs per GPT call ───────────────────────────────
  const BATCH_SIZE = 5;
  let scored = 0;

  for (let i = 0; i < toScore.length; i += BATCH_SIZE) {
    const batch = toScore.slice(i, i + BATCH_SIZE);
    try {
      const results = await scoreBatch(batch, resumeData, feedbackContext);
      for (let j = 0; j < results.length; j++) {
        const job = batch[j];
        const result = results[j];
        if (!result) continue;
        await db
          .insert(jobMatches)
          .values({
            jobId:          job.id,
            resumeId,
            score:          result.score,
            strengths:      result.strengths,
            weaknesses:     result.weaknesses,
            recommendation: result.recommendation,
            confidence:     result.confidence,
            reasoning:      result.reasoning ?? null,
            scoredAt:       new Date(),
          })
          .onConflictDoUpdate({
            target: [jobMatches.jobId, jobMatches.resumeId],
            set: {
              score:          result.score,
              strengths:      result.strengths,
              weaknesses:     result.weaknesses,
              recommendation: result.recommendation,
              confidence:     result.confidence,
              reasoning:      result.reasoning ?? null,
              scoredAt:       new Date(),
            },
          });
        scored++;
      }
    } catch (err) {
      console.error(`[matchJobs] batch ${i}–${i + BATCH_SIZE} failed`, err);
    }
  }

  revalidatePath('/matches');
  return {
    scored,
    cached: freshJobIds.size,
    total: candidateJobs.length,
    message: `Scored ${scored} new jobs (${freshJobIds.size} served from cache)`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch scorer — sends 5 jobs in ONE GPT call
// ─────────────────────────────────────────────────────────────────────────────
async function scoreBatch(
  batch: Array<{ id: string; title: string; company: string; location: string | null; description: string; requirements: string | null }>,
  resumeData: Record<string, unknown>,
  feedbackContext: string,
) {
  const jobsBlock = batch
    .map((j, idx) => `JOB ${idx + 1}:
Title: ${j.title}
Company: ${j.company}
Location: ${j.location ?? 'Not specified'}
Description: ${j.description.slice(0, 800)}
Requirements: ${(j.requirements ?? '').slice(0, 400)}`)
    .join('\n\n---\n\n');

  // Build a compact candidate summary instead of dumping full resume JSON (saves ~50% tokens)
  const skills = resumeData.skills ?? resumeData.technicalSkills;
  const experience = resumeData.experience ?? resumeData.workExperience;
  const candidateSummary = [
    resumeData.summary ? `Summary: ${String(resumeData.summary).slice(0, 300)}` : '',
    Array.isArray(skills) ? `Skills: ${(skills as string[]).slice(0, 20).join(', ')}` : '',
    Array.isArray(experience) ? `Experience:\n${(experience as any[]).slice(0, 4).map((e: any) =>
      `- ${e.title ?? ''} at ${e.company ?? ''} (${e.startDate ?? ''}–${e.endDate ?? 'Present'})`
    ).join('\n')}` : '',
  ].filter(Boolean).join('\n');

  const prompt = `You are a job matching AI. Score how well this candidate fits each job.

CANDIDATE PROFILE:
${candidateSummary.slice(0, 1200)}

${feedbackContext ? `HISTORICAL FEEDBACK (use to calibrate scores):\n${feedbackContext}\n` : ''}

JOBS TO SCORE:
${jobsBlock}

Return ONLY a valid JSON array with exactly ${batch.length} objects (one per job, in order):
[
  {
    "score": 0-100,
    "strengths": ["up to 4 specific strengths"],
    "weaknesses": ["up to 4 specific gaps"],
    "recommendation": "one sentence",
    "confidence": 0.0-1.0,
    "reasoning": "brief reasoning"
  }
]`;

  const response = await rateLimitedOpenAI(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini', // cheaper than gpt-4o, fast enough for matching
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })
  );

  const raw = response.choices[0].message.content ?? '{}';
  // GPT wraps array in object sometimes — handle both
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const arr: any[] = Array.isArray(parsed) ? parsed : (parsed.results ?? parsed.jobs ?? Object.values(parsed));
  return arr.slice(0, batch.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback loop — called when application status changes
// ─────────────────────────────────────────────────────────────────────────────
export async function recordMatchFeedback(
  jobId: string,
  resumeId: string,
  signal: 'positive' | 'negative'
) {
  await db
    .update(jobMatches)
    .set({ feedbackSignal: signal })
    .where(and(eq(jobMatches.jobId, jobId), eq(jobMatches.resumeId, resumeId)));
}

function buildFeedbackContext(
  rows: Array<{ score: number; feedbackSignal: string | null }>
): string {
  const positives = rows.filter(r => r.feedbackSignal === 'positive').map(r => r.score);
  const negatives = rows.filter(r => r.feedbackSignal === 'negative').map(r => r.score);
  if (!positives.length && !negatives.length) return '';

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const lines: string[] = [];
  if (positives.length) lines.push(`- ${positives.length} past job(s) got interviews/offers (avg score: ${avg(positives)})`);
  if (negatives.length) lines.push(`- ${negatives.length} past job(s) were rejected (avg score: ${avg(negatives)})`);
  lines.push('Use this to calibrate scores — if past positives averaged 72, a similar job should score similarly.');
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildResumeText(resumeData: Record<string, unknown>): string {
  const parts: string[] = [];
  const summary = resumeData.summary ?? resumeData.professionalSummary;
  if (typeof summary === 'string') parts.push(summary);

  const skills = resumeData.skills ?? resumeData.technicalSkills;
  if (Array.isArray(skills)) parts.push(skills.join(', '));
  else if (typeof skills === 'string') parts.push(skills);

  const experience = resumeData.experience ?? resumeData.workExperience;
  if (Array.isArray(experience)) {
    for (const exp of experience) {
      if (exp && typeof exp === 'object') {
        const e = exp as Record<string, unknown>;
        parts.push([e.title, e.company, e.description].filter(Boolean).join(' — '));
      }
    }
  }
  return parts.join('\n').slice(0, 4000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Get matches (for display)
// ─────────────────────────────────────────────────────────────────────────────
export async function getJobMatches(resumeId: string) {
  return db
    .select({ match: jobMatches, job: jobs })
    .from(jobMatches)
    .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
    .where(eq(jobMatches.resumeId, resumeId))
    .orderBy(desc(jobMatches.score));
}

// ─────────────────────────────────────────────────────────────────────────────
// Force re-score a single job (bypass 24h cache)
// ─────────────────────────────────────────────────────────────────────────────
export async function forceRescore(jobId: string, resumeId: string) {
  await db
    .update(jobMatches)
    .set({ scoredAt: new Date(0) }) // set to epoch → will be re-scored on next run
    .where(and(eq(jobMatches.jobId, jobId), eq(jobMatches.resumeId, resumeId)));
}
