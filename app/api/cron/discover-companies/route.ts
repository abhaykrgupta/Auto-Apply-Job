import { NextRequest, NextResponse } from 'next/server';
import { runAutoDiscovery } from '@/lib/company-discovery/auto-discovery-engine';

// Vercel cron: runs daily at 3 AM UTC
// Add to vercel.json: { "path": "/api/cron/discover-companies", "schedule": "0 3 * * *" }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
