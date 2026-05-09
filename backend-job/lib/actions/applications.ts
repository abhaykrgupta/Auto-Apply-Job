

import { db } from '@/lib/db';
import { applications, applicationLogs, jobs } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';


export async function getApplications(limit = 100, offset = 0) {
  return db
    .select({
      application: applications,
      job: jobs,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getApplicationById(id: string) {
  const [result] = await db
    .select({ application: applications, job: jobs })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.id, id));

  if (!result) return null;

  const logs = await db
    .select()
    .from(applicationLogs)
    .where(eq(applicationLogs.applicationId, id))
    .orderBy(applicationLogs.createdAt);

  return { ...result, logs };
}

export async function createApplication(jobId: string, resumeId: string, resumeMatchScore?: number) {
  // Prevent duplicate applications for the same job+resume pair
  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.jobId, jobId), eq(applications.resumeId, resumeId)))
    .limit(1);
  if (existing) return existing as typeof applications.$inferSelect;

  const meta = resumeMatchScore !== undefined ? { resumeMatchScore } : undefined;
  const [app] = await db
    .insert(applications)
    .values({ jobId, resumeId, status: 'pending', method: 'auto', metadata: meta })
    .returning();

  await db.insert(applicationLogs).values({
    applicationId: app.id,
    level: 'info',
    message: resumeMatchScore !== undefined
      ? `Application created. Resume match score: ${resumeMatchScore}%`
      : 'Application created, pending processing.',
  });


  return app;
}

export async function updateApplicationStatus(
  id: string,
  status: 'pending' | 'applied' | 'failed' | 'manual_review' | 'interviewing' | 'rejected' | 'accepted',
  notes?: string
) {
  const [app] = await db
    .update(applications)
    .set({ status, notes, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning();

  await db.insert(applicationLogs).values({
    applicationId: id,
    level: 'info',
    message: `Status updated to: ${status}`,
  });


  return app;
}

export async function getApplicationStats() {
  // Single aggregation query instead of loading all rows into memory
  const rows = await db
    .select({ status: applications.status, count: sql<number>`count(*)::int` })
    .from(applications)
    .groupBy(applications.status);

  const counts: Record<string, number> = {};
  for (const r of rows) if (r.status) counts[r.status] = r.count;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const applied = counts['applied'] ?? 0;
  const failed = counts['failed'] ?? 0;
  const manualReview = counts['manual_review'] ?? 0;
  const interviewing = counts['interviewing'] ?? 0;
  const accepted = counts['accepted'] ?? 0;
  const successRate = total > 0 ? Math.round((applied / total) * 100) : 0;

  return { total, applied, failed, manualReview, interviewing, accepted, successRate };
}
