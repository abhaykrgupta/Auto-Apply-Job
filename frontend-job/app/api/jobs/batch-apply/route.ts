import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { applications, profile, resumes, jobs } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // 1. Require auth
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobIds } = body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'jobIds array is required' }, { status: 400 });
    }

    // 2. Resolve profile → resume
    const [userProfile] = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Profile not found. Please complete your profile before applying.' },
        { status: 400 },
      );
    }

    const [resume] = await db
      .select({ id: resumes.id })
      .from(resumes)
      .where(eq(resumes.profileId, userProfile.id))
      .limit(1);

    if (!resume) {
      return NextResponse.json(
        { error: 'No resume found. Please upload a resume before applying.' },
        { status: 400 },
      );
    }

    // 3. Find which of these jobs already have applications for THIS user's resume (skip duplicates)
    const existingApps = await db
      .select({ jobId: applications.jobId })
      .from(applications)
      .where(and(inArray(applications.jobId, jobIds), eq(applications.resumeId, resume.id)));

    const alreadyApplied = new Set(existingApps.map((a) => a.jobId));
    const toApply = jobIds.filter((id: string) => !alreadyApplied.has(id));

    if (toApply.length === 0) {
      return NextResponse.json({ queued: 0, failed: 0, skipped: jobIds.length });
    }

    // 4. Verify jobs exist
    const existingJobs = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(inArray(jobs.id, toApply));

    const validJobIds = existingJobs.map((j) => j.id);

    if (validJobIds.length === 0) {
      return NextResponse.json({ queued: 0, failed: toApply.length });
    }

    // 5. Bulk insert applications
    await db.insert(applications).values(
      validJobIds.map((jobId) => ({
        jobId,
        resumeId: resume.id,
        status: 'pending' as const,
        method: 'agent',
      }))
    );

    return NextResponse.json({
      queued: validJobIds.length,
      failed: toApply.length - validJobIds.length,
      skipped: alreadyApplied.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Batch apply failed';
    console.error('[/api/jobs/batch-apply]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
