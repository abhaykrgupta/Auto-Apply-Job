import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/actions/jobs';
import { getActiveResumes, getResumes } from '@/lib/actions/resume';
import { createApplication } from '@/lib/actions/applications';
import { findBestResume } from '@/lib/utils/resume-matcher';

import { batchApplyBodySchema } from '@/lib/validations/jobs';

export async function POST(req: NextRequest) {
  try {
    const parsed = batchApplyBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { jobIds } = parsed.data;

    const activeResumes = await getActiveResumes();
    const candidates = activeResumes.length > 0 ? activeResumes : await getResumes();
    if (candidates.length === 0)
      return NextResponse.json({ error: 'No resume found. Upload a resume first.' }, { status: 400 });

    const results = await Promise.allSettled(
      jobIds.map(async (jobId: string) => {
        const job = await getJobById(jobId);
        if (!job) throw new Error(`Job ${jobId} not found`);

        const picked = await findBestResume(`${job.title} ${job.description} ${job.requirements ?? ''}`, candidates);
        const resume = picked?.resume ?? candidates[0];

        return createApplication(jobId, resume.id);
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ queued: succeeded, failed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Batch apply failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
