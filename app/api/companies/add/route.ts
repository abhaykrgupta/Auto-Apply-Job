import { NextRequest, NextResponse } from 'next/server';
import { addCompanyManually } from '@/lib/actions/companies';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    const company = await addCompanyManually(url);
    return NextResponse.json(company);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
