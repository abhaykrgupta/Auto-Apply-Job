import { getCompanies, getCompanyStats } from '@/lib/actions/companies';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [companies, stats] = await Promise.all([getCompanies(), getCompanyStats()]);
    return NextResponse.json({ companies, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Companies GET]', message);
    return NextResponse.json({ error: `Database error: ${message}` }, { status: 500 });
  }
}
