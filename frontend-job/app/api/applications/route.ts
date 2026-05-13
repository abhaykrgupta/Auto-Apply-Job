import { NextRequest, NextResponse } from 'next/server';
import { getCopilotUser } from '@/lib/copilot-auth';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { applications, extensionApplications, jobs, profile, resumes } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

// GET — list auto-applied applications for the logged-in user (scoped by session)
export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve the user's resume IDs
  const [userProfile] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
  if (!userProfile) return NextResponse.json([]);

  const userResumes = await db.select({ id: resumes.id }).from(resumes).where(eq(resumes.profileId, userProfile.id));
  const resumeIds = userResumes.map((r) => r.id);
  // No resumes in Drizzle yet — user hasn't applied to anything, return empty list
  if (resumeIds.length === 0) return NextResponse.json([]);

  const rows = await db
    .select({
      application: applications,
      job: jobs,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(inArray(applications.resumeId, resumeIds))
    .orderBy(desc(applications.createdAt))
    .limit(200);

  return NextResponse.json(rows);
}

// POST — track a new application submitted via Co-Pilot extension
export async function POST(req: NextRequest) {
  const userId = await getCopilotUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const [row] = await db
    .insert(extensionApplications)
    .values({
      userId,
      company:       body.company       ?? 'Unknown',
      role:          body.role          ?? 'Unknown',
      atsId:         body.atsId         ?? null,
      url:           body.url           ?? null,
      status:        body.status        ?? 'in_progress',
      fieldsCount:   body.fieldsCount   ?? 0,
      resumeVersion: body.resumeVersion ?? null,
      appliedAt:     body.appliedAt ? new Date(body.appliedAt) : new Date(),
      metadata:      body.metadata      ?? null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
