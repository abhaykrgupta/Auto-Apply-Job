'use server';

import { db } from '@/lib/db';
import { applications, applicationLogs, jobs, resumes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getApplications() {
  return db
    .select({
      application: applications,
      job: jobs,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.createdAt));
}

export async function getApplicationById(id: string) {
  const [result] = await db
    .select({
      application: applications,
      job: jobs,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.id, id));
  return result;
}

export async function createApplication(jobId: string, resumeId: string, resumeMatchScore?: number) {
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

  revalidatePath('/applications');
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

  revalidatePath('/applications');
  return app;
}

export async function getApplicationStats() {
  const allApps = await db
    .select({
      application: applications,
    })
    .from(applications);

  const total = allApps.length;
  const applied = allApps.filter((a) => a.application.status === 'applied').length;
  const failed = allApps.filter((a) => a.application.status === 'failed').length;
  const manualReview = allApps.filter((a) => a.application.status === 'manual_review').length;
  const interviewing = allApps.filter((a) => a.application.status === 'interviewing').length;
  const accepted = allApps.filter((a) => a.application.status === 'accepted').length;
  const successRate = total > 0 ? Math.round((applied / total) * 100) : 0;

  return { total, applied, failed, manualReview, interviewing, accepted, successRate };
}
