import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runAutoDiscovery } from '@/lib/company-discovery/auto-discovery-engine';

function verifyCronSecret(authHeader: string | null): boolean {
  if (!process.env.CRON_SECRET || !authHeader) return false;
  try {
    const a = Buffer.from(authHeader);
    const b = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

// Vercel cron: runs daily at 3 AM UTC
// Add to vercel.json: { "path": "/api/cron/discover-companies", "schedule": "0 3 * * *" }
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAutoDiscovery({
      sources: ['seed', 'yc', 'github', 'vc', 'wellfound'],
      skipAtsDetection: true,
      triggeredBy: 'cron',
    });

    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron discovery failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
