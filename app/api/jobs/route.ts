import { getJobs } from '@/lib/actions/jobs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json(jobs);
  } catch {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
}
