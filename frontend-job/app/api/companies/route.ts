import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCompanies, getCompanyStats } from '@/lib/actions/companies';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const [companiesList, stats] = await Promise.all([
      getCompanies(userId),
      getCompanyStats(),
    ]);

    return NextResponse.json({ companies: companiesList, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/companies GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
