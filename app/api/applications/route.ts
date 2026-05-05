import { getApplications } from '@/lib/actions/applications';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const applications = await getApplications();
    return NextResponse.json(applications);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Applications GET]', message);
    return NextResponse.json({ error: `Database error: ${message}` }, { status: 500 });
  }
}
