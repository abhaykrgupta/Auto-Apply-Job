import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { RetryEngine } from '@/lib/automation/retry-engine';

function verifyCronSecret(authHeader: string | null): boolean {
  if (!process.env.CRON_SECRET || !authHeader) return false;
  try {
    const a = Buffer.from(authHeader);
    const b = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

// Vercel cron: 0 12 * * * (noon UTC daily)
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const engine = new RetryEngine();
  const result = await engine.retryFailedApplications();

  return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
}
