import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, resumes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { tailorResumeToJob } from '@/lib/openai/resume-tailor';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.isActive, true))
      .limit(1);

    if (!resume) return NextResponse.json({ error: 'No active resume' }, { status: 404 });
    if (!resume.parsedData) return NextResponse.json({ error: 'Resume not parsed yet' }, { status: 400 });

    const tailored = await tailorResumeToJob(resume.parsedData, {
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
    });

    return NextResponse.json({ success: true, tailored, jobId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tailoring failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
