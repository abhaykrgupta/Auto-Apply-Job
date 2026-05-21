import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCompanies, getCompanyStats } from '@/lib/actions/companies';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const q = req.nextUrl.searchParams;
    const filters = {
      search:  q.get('search')  ?? undefined,
      atsType: q.get('atsType') ?? undefined,
      source:  q.get('source')  ?? undefined,
      country: q.get('country') ?? undefined,
      limit:   q.get('limit')   ? parseInt(q.get('limit')!,  10) : 50,
      offset:  q.get('offset')  ? parseInt(q.get('offset')!, 10) : 0,
    };

    const [companiesList, stats] = await Promise.all([
      getCompanies(userId, filters),
      getCompanyStats(),
    ]);

    return NextResponse.json({ companies: companiesList, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/companies GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
