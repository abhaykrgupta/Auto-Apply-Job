import { getCompanies, getCompanyStats } from '@/lib/actions/companies';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [companies, stats] = await Promise.all([getCompanies(), getCompanyStats()]);
    return NextResponse.json({ companies, stats });
  } catch {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
}
