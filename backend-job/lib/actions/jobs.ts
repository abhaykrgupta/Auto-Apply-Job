

import { db } from '../db';
import { jobs, jobMatches, resumes } from '../db/schema';
import { scoreJobMatch } from '../openai/job-matcher';
import { getEmbedding } from '../openai/embeddings';
import { eq, desc, and, gte, ilike, sql } from 'drizzle-orm';


export interface JobFilters {
  search?:     string;   // title, company, location, description
  status?:     string;   // active | expired | filled
  source?:     string;   // greenhouse | lever | linkedin | ...
  country?:    string;   // india | us | uk | remote | uae | ...
  location?:   string;   // free-text location (e.g. "Mumbai", "Bangalore")
  datePosted?: string;   // today | yesterday | past_week | week | month
  limit?:      number;
  offset?:     number;
}

export async function getJobs(filters: JobFilters = {}) {
  const {
    search,
    status,
    source,
    country,
    location,
    datePosted,
    limit  = 50,
    offset = 0,
  } = filters;

  const safeLimit  = Math.min(Math.max(1, limit),  200);
  const safeOffset = Math.max(0, offset);

  const conditions = [];

  if (status) {
    conditions.push(eq(jobs.status, status as 'active' | 'expired' | 'filled'));
  } else {
    conditions.push(eq(jobs.status, 'active')); // default: only active
  }

  if (source) {
    conditions.push(ilike(jobs.source, source));
  }

  // Full-text search across title, company, location, and description
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      sql`(${jobs.title} ILIKE ${term} OR ${jobs.company} ILIKE ${term} OR ${jobs.location} ILIKE ${term} OR ${jobs.description} ILIKE ${term})`
    );
  }

  // Free-text location filter (city, state, region)
  if (location?.trim()) {
    conditions.push(ilike(jobs.location, `%${location.trim()}%`));
  }

  // Country/location filter — map common names to location patterns
  if (country && country !== 'all') {
    const locationMap: Record<string, string> = {
      india:     '%india%',
      remote:    '%remote%',
      us:        '%united states%',
      uk:        '%united kingdom%',
      canada:    '%canada%',
      germany:   '%germany%',
      australia: '%australia%',
      singapore: '%singapore%',
      uae:       '%united arab emirates%',
      dubai:     '%dubai%',
    };
    const pattern = locationMap[country.toLowerCase()] ?? `%${country}%`;
    conditions.push(ilike(jobs.location, pattern));
  }

  // Date posted filter
  if (datePosted && datePosted !== 'all') {
    const daysMap: Record<string, number> = { today: 1, yesterday: 2, week: 7, past_week: 7, month: 30 };
    const days = daysMap[datePosted];
    if (days) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      conditions.push(gte(jobs.createdAt, cutoff));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(jobs)
      .where(where)
      .orderBy(desc(jobs.createdAt))
      .limit(safeLimit)
      .offset(safeOffset),
    db.select({ total: sql<number>`count(*)::int` }).from(jobs).where(where),
  ]);

  return { data: rows, total, limit: safeLimit, offset: safeOffset };
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


  return results;
}

export async function getJobMatches(
  resumeId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const safeLimit  = Math.min(Math.max(1, limit),  200); // cap at 200
  const safeOffset = Math.max(0, offset);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ match: jobMatches, job: jobs })
      .from(jobMatches)
      .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
      .where(eq(jobMatches.resumeId, resumeId))
      .orderBy(desc(jobMatches.score))
      .limit(safeLimit)
      .offset(safeOffset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(jobMatches)
      .where(eq(jobMatches.resumeId, resumeId)),
  ]);

  return { data: rows, total, limit: safeLimit, offset: safeOffset };
}
