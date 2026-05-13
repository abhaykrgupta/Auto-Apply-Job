import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  resumeProjects, resumes, jobMatches, generatedContent, applications, applicationLogs, resumePerformance, profile
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function getProfileId(userId: string): Promise<string | null> {
  const [userProfile] = await db.select({ id: profile.id }).from(profile).where(eq(profile.userId, userId)).limit(1);
  return userProfile?.id ?? null;
}

async function verifyOwnership(projectId: string, profileId: string): Promise<boolean> {
  const [project] = await db
    .select({ id: resumeProjects.id })
    .from(resumeProjects)
    .where(eq(resumeProjects.id, projectId))
    .limit(1);
  if (!project) return false;
  // Re-query with profileId filter to confirm ownership
  const [owned] = await db
    .select({ id: resumeProjects.id })
    .from(resumeProjects)
    .where(eq(resumeProjects.id, projectId))
    .limit(1);
  return !!owned && (await db.select({ profileId: resumeProjects.profileId }).from(resumeProjects).where(eq(resumeProjects.id, projectId)).limit(1))[0]?.profileId === profileId;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const profileId = await getProfileId(userId);
  if (!profileId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [project] = await db
    .select()
    .from(resumeProjects)
    .where(eq(resumeProjects.id, id))
    .limit(1);

  if (!project || project.profileId !== profileId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const profileId = await getProfileId(userId);
  if (!profileId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [existing] = await db.select({ profileId: resumeProjects.profileId }).from(resumeProjects).where(eq(resumeProjects.id, id)).limit(1);
  if (!existing || existing.profileId !== profileId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const [updated] = await db.update(resumeProjects)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(resumeProjects.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const profileId = await getProfileId(userId);
  if (!profileId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [project] = await db.select().from(resumeProjects).where(eq(resumeProjects.id, id)).limit(1);
  if (!project || project.profileId !== profileId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (project?.deployedResumeId) {
    const resumeId = project.deployedResumeId;

    // 1. Nullify the reference in the project itself first to avoid FK violation during resume deletion
    await db.update(resumeProjects).set({ deployedResumeId: null }).where(eq(resumeProjects.id, id));

    // 2. Manually cascade deletes to prevent other foreign key constraint violations
    await db.delete(jobMatches).where(eq(jobMatches.resumeId, resumeId));
    await db.delete(generatedContent).where(eq(generatedContent.resumeId, resumeId));
    await db.delete(resumePerformance).where(eq(resumePerformance.resumeId, resumeId));

    // 3. Delete applications and their logs
    const apps = await db.select({ id: applications.id }).from(applications).where(eq(applications.resumeId, resumeId));
    if (apps.length > 0) {
      const appIds = apps.map(a => a.id);
      await db.delete(applicationLogs).where(inArray(applicationLogs.applicationId, appIds));
      await db.delete(applications).where(inArray(applications.id, appIds));
    }

    // 4. Finally delete the resume record
    await db.delete(resumes).where(eq(resumes.id, resumeId));
  }
  await db.delete(resumeProjects).where(eq(resumeProjects.id, id));
  return NextResponse.json({ ok: true });
}
