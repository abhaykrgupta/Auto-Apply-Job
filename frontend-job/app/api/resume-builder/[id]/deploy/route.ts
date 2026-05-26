import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { resumeProjects, resumes, profile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement, type JSXElementConstructor } from 'react';
import path from 'path';
import { promises as fsp, existsSync, mkdirSync } from 'fs';

async function buildPdfBuffer(project: any): Promise<Buffer> {
  const { ResumePdfDocument } = await import('@/components/resume-builder/pdf/ResumePdfDocument');
  const element = createElement(ResumePdfDocument, { data: project.data, templateId: project.templateId }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>;
  return Buffer.from(await renderToBuffer(element));
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;

  // ── Ownership check ───────────────────────────────────────────────────────
  const [[userProfile], [project]] = await Promise.all([
    db.select().from(profile).where(eq(profile.userId, userId)).limit(1),
    db.select().from(resumeProjects).where(eq(resumeProjects.id, id)).limit(1),
  ]);

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!userProfile || project.profileId !== userProfile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const d = project.data as any;
  if (!d?.personal?.name?.trim()) {
    return NextResponse.json({ error: 'Resume must have a name before deploying.' }, { status: 400 });
  }
  if (!d?.personal?.email?.trim()) {
    return NextResponse.json({ error: 'Resume must have an email before deploying.' }, { status: 400 });
  }
  if (!d?.experience?.length && !d?.education?.length) {
    return NextResponse.json({ error: 'Resume must have at least one experience or education entry.' }, { status: 400 });
  }

  try {
    const pdfBuffer = await buildPdfBuffer(project);

    // ── Async file I/O (non-blocking) ─────────────────────────────────────
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

    const fileName = `resume-${id}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    await fsp.writeFile(filePath, pdfBuffer);
    const fileUrl = `/uploads/${fileName}`;

    // Delete old deployed resume (non-fatal if missing)
    if (project.deployedResumeId) {
      const [old] = await db.select().from(resumes).where(eq(resumes.id, project.deployedResumeId)).limit(1);
      if (old?.filePath && existsSync(old.filePath)) {
        await fsp.unlink(old.filePath).catch(() => {});
      }
      await db.delete(resumes).where(eq(resumes.id, project.deployedResumeId));
    }

    // Insert resume scoped to current user's profile
    const data = project.data as any;
    const [resume] = await db.insert(resumes).values({
      profileId: userProfile.id,
      fileName,
      filePath,
      fileUrl,
      label: project.name,
      parsedData: {
        skills: data.skills?.technical || [],
        experience: data.experience || [],
        education: data.education || [],
      },
      isActive: true,
    }).returning();

    await db.update(resumeProjects)
      .set({ status: 'deployed', deployedResumeId: resume.id, updatedAt: new Date() })
      .where(eq(resumeProjects.id, id));

    return NextResponse.json({ ok: true, resumeId: resume.id, fileUrl });
  } catch (err) {
    console.error('[resume-builder/deploy]', err);
    return NextResponse.json({ error: 'Failed to deploy resume' }, { status: 500 });
  }
}
