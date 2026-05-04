import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/actions/jobs';
import { getResumeById, getActiveResumes, getResumes } from '@/lib/actions/resume';
import { createApplication } from '@/lib/actions/applications';
import { applyToJob } from '@/lib/automation/apply-engine';
import { pickBestResume } from '@/lib/utils/resume-matcher';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = req.headers.get('content-length') !== '0'
      ? await req.json().catch(() => ({}))
      : {};
    const { resumeId } = body;

    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    let resume;
    let matchScore: number | undefined;

    if (resumeId) {
      resume = await getResumeById(resumeId);
    } else {
      const activeResumes = await getActiveResumes();
      const candidates = activeResumes.length > 0 ? activeResumes : await getResumes();
      const picked = pickBestResume(candidates, {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
      });
      resume = picked?.resume ?? null;
      matchScore = picked?.score;
    }

    if (!resume) return NextResponse.json({ error: 'No resume found. Upload a resume first.' }, { status: 400 });

    const application = await createApplication(id, resume.id, matchScore);

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

    return NextResponse.json({
      applicationId: application.id,
      resumeLabel: resume.label ?? resume.fileName,
      matchScore,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apply failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
