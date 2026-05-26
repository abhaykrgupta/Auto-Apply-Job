import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { resumeProjects, profile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  try {
    const { ResumePdfDocument } = await import('@/components/resume-builder/pdf/ResumePdfDocument');
    const element = createElement(ResumePdfDocument as any, {
      data: project.data as any,
      templateId: project.templateId,
    });
    const buffer = Buffer.from(await renderToBuffer(element as any));
    const safeFileName = project.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 100);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}.pdf"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    console.error('[resume-builder/download]', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
