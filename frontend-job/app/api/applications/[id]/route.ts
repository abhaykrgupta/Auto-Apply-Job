import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { applications, jobs, profile, resumes, applicationLogs } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { recordMatchFeedback } from '@/lib/actions/jobs';

/** Verify the application belongs to the current user. Returns row or null. */
async function getOwnedApplication(userId: string, applicationId: string) {
  const [userProfile] = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  if (!userProfile) return null;

  const userResumes = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.profileId, userProfile.id));

  if (!userResumes.length) return null;
  const resumeIds = userResumes.map((r) => r.id);

  const [row] = await db
    .select({ application: applications, job: jobs })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!row) return null;
  if (!resumeIds.includes(row.application.resumeId)) return null;
  return row;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await getOwnedApplication(session.user.id, id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch step-by-step bot activity logs for this application
  const logs = await db
    .select()
    .from(applicationLogs)
    .where(eq(applicationLogs.applicationId, id))
    .orderBy(asc(applicationLogs.createdAt));

  return NextResponse.json({ ...row, logs });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await getOwnedApplication(session.user.id, id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};

  if (body.status !== undefined)       allowed.status       = body.status;
  if (body.notes !== undefined)        allowed.notes        = body.notes;
  if (body.appliedAt !== undefined)    allowed.appliedAt    = new Date(body.appliedAt);
  if (body.errorMessage !== undefined) allowed.errorMessage = body.errorMessage;

  if (!Object.keys(allowed).length) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  const [updated] = await db
    .update(applications)
    .set(allowed)
    .where(eq(applications.id, id))
    .returning();

  // ── Feedback loop: record signal when status changes to terminal state ──
  if (body.status && row.application.resumeId && row.application.jobId) {
    const positiveStatuses = ['interviewing', 'accepted'];
    const negativeStatuses = ['rejected'];
    if (positiveStatuses.includes(body.status)) {
      recordMatchFeedback(row.application.jobId, row.application.resumeId, 'positive').catch(() => {});
    } else if (negativeStatuses.includes(body.status)) {
      recordMatchFeedback(row.application.jobId, row.application.resumeId, 'negative').catch(() => {});
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await getOwnedApplication(session.user.id, id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(applications).where(eq(applications.id, id));
  return NextResponse.json({ success: true });
}
