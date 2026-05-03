import { getResumes } from '@/lib/actions/resume';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const resumes = await getResumes();
    return NextResponse.json(resumes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/resume]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
