import { getJobMatches } from '@/lib/actions/jobs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('resumeId');
    if (!resumeId) return NextResponse.json({ error: 'resumeId required' }, { status: 400 });
    const matches = await getJobMatches(resumeId);
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
