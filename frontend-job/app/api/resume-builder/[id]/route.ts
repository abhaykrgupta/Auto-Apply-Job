import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resumeProjects, resumes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    await db.delete(resumes).where(eq(resumes.id, project.deployedResumeId));
  }
  await db.delete(resumeProjects).where(eq(resumeProjects.id, id));
  return NextResponse.json({ ok: true });
}
