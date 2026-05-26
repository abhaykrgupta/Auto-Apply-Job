import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Public: minimal response — no env details leaked
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}

// Authenticated ping — confirms session is valid, no service details exposed
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
