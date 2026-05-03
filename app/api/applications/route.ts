import { getApplications } from '@/lib/actions/applications';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const applications = await getApplications();
    return NextResponse.json(applications);
  } catch {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
}
