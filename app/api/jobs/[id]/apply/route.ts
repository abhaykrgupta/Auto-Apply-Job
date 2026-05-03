import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/actions/jobs';
import { getResumeById, getResumes } from '@/lib/actions/resume';
import { createApplication } from '@/lib/actions/applications';
import { applyToJob } from '@/lib/automation/apply-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = req.headers.get('content-length') !== '0'
      ? await req.json().catch(() => ({}))
      : {};
    const { resumeId } = body;

    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Get resume
    let resume = resumeId ? await getResumeById(resumeId) : null;
    if (!resume) {
      const resumes = await getResumes();
      resume = resumes.find((r: any) => r.isActive) ?? resumes[0];
    }
    if (!resume) return NextResponse.json({ error: 'No resume found' }, { status: 400 });

    // Create application record
    const application = await createApplication(id, resume.id);

    // Run auto-apply
    const result = await applyToJob(
      application.id,
      {
        id: job.id,
        title: job.title,
        company: job.company,
        description: job.description,
        applyUrl: job.applyUrl,
        requirements: job.requirements,
      },
      {
        id: resume.id,
        filePath: resume.filePath,
        parsedData: resume.parsedData as Record<string, unknown> | null,
      }
    );

    return NextResponse.json({ applicationId: application.id, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apply failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
