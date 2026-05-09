import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  resumeProjects, resumes, jobMatches, generatedContent, applications, applicationLogs, resumePerformance
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project] = await db.select().from(resumeProjects).where(eq(resumeProjects.id, id)).limit(1);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [updated] = await db.update(resumeProjects)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(resumeProjects.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project] = await db.select().from(resumeProjects).where(eq(resumeProjects.id, id)).limit(1);
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
