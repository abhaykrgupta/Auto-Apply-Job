import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resumeProjects, resumes, profile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement, type JSXElementConstructor } from 'react';
import path from 'path';
import fs from 'fs';

// We import the PDF document builder
async function buildPdfBuffer(project: any): Promise<Buffer> {
  // Dynamic import to avoid SSR issues
  const { ResumePdfDocument } = await import('@/components/resume-builder/pdf/ResumePdfDocument');
  const element = createElement(ResumePdfDocument, { data: project.data, templateId: project.templateId }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>;
  return Buffer.from(await renderToBuffer(element));
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project] = await db.select().from(resumeProjects).where(eq(resumeProjects.id, id)).limit(1);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Server-side validation — must have name, email, and at least one experience or education entry
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

  const [p] = await db.select().from(profile).limit(1);
  if (!p) return NextResponse.json({ error: 'No profile' }, { status: 400 });

  try {
    const pdfBuffer = await buildPdfBuffer(project);

    // Save PDF to uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `resume-${id}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    const fileUrl = `/uploads/${fileName}`;

    // Delete old deployed resume if exists
    if (project.deployedResumeId) {
      const [old] = await db.select().from(resumes).where(eq(resumes.id, project.deployedResumeId)).limit(1);
      if (old?.filePath && fs.existsSync(old.filePath)) fs.unlinkSync(old.filePath);
      await db.delete(resumes).where(eq(resumes.id, project.deployedResumeId));
    }

    // Insert into resumes table
    const data = project.data as any;
    const [resume] = await db.insert(resumes).values({
      profileId: p.id,
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

    // Update project status
    await db.update(resumeProjects)
      .set({ status: 'deployed', deployedResumeId: resume.id, updatedAt: new Date() })
      .where(eq(resumeProjects.id, id));

    return NextResponse.json({ ok: true, resumeId: resume.id, fileUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
