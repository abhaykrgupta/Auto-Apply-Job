import { matchResumeSchema } from '@/lib/validations/jobs';
import { matchJobsToResume } from '@/lib/actions/jobs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit/simple-rate-limiter';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Max 10 match runs per user per hour (each run can call GPT many times)
  if (!checkRateLimit(`match:${session.user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit: max 10 match runs per hour.' }, { status: 429 });
  }

  try {
    const parsed = matchResumeSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { resumeId, ...filters } = parsed.data;
    const results = await matchJobsToResume(resumeId, filters);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Matching failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
