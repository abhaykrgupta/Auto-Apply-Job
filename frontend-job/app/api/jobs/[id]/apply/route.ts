import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { applications, profile, resumes, jobs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;

    // 1. Require auth
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify the job exists
    const [job] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 3. Find the user's profile
    const [userProfile] = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Profile not found. Please complete your profile first.' },
        { status: 400 },
      );
    }

    // 4. Find the user's resume (prefer active)
    const userResumes = await db
      .select({ id: resumes.id, isActive: resumes.isActive })
      .from(resumes)
      .where(eq(resumes.profileId, userProfile.id));

    const resume = userResumes.find((r) => r.isActive) ?? userResumes[0];

    if (!resume) {
      return NextResponse.json(
        { error: 'No resume found. Please upload a resume before applying.' },
        { status: 400 },
      );
    }

    // 5. Skip duplicate (scoped to this user's resume)
    const [existing] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.resumeId, resume.id), eq(applications.jobId, jobId)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { message: 'Already in your applications queue.', applicationId: existing.id },
        { status: 200 },
      );
    }

    // 6. Create the queued application
    const [newApp] = await db
      .insert(applications)
      .values({ jobId, resumeId: resume.id, status: 'pending', method: 'agent' })
      .returning();

    return NextResponse.json(
      { message: 'Application queued!', applicationId: newApp.id },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apply failed';
    console.error('[/api/jobs/[id]/apply]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
