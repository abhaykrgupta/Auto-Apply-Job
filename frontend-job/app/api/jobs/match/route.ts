import { matchResumeSchema } from '@/lib/validations/jobs';
import { matchJobsToResume } from '@/lib/actions/jobs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const parsed = matchResumeSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { resumeId } = parsed.data;
    const results = await matchJobsToResume(resumeId);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Matching failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
