import { companyAddSchema } from '@/lib/validations/companies';
import { NextRequest, NextResponse } from 'next/server';
import { addCompanyManually } from '@/lib/actions/companies';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parsed = companyAddSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { url } = parsed.data;
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    // Pass userId so the company is private to this user
    const company = await addCompanyManually(url, session.user.id);
    return NextResponse.json(company);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
