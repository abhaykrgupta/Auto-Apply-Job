import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resumeProjects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project] = await db.select().from(resumeProjects).where(eq(resumeProjects.id, id)).limit(1);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const { ResumePdfDocument } = await import('@/components/resume-builder/pdf/ResumePdfDocument');
    const element = createElement(ResumePdfDocument as any, {
      data: project.data as any,
      templateId: project.templateId,
    });
    const buffer = Buffer.from(await renderToBuffer(element as any));
    const fileName = `${project.name.replace(/\s+/g, '-')}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
