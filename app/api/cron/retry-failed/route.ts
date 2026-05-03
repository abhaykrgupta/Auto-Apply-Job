import { NextRequest, NextResponse } from 'next/server';
import { RetryEngine } from '@/lib/automation/retry-engine';

// Vercel cron: 0 12 * * * (noon UTC daily)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const engine = new RetryEngine();
  const result = await engine.retryFailedApplications();

  return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
}
