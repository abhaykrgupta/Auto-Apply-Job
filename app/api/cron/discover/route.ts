import { NextRequest, NextResponse } from 'next/server';
import { discoveryEngine } from '@/lib/company-discovery/discovery-engine';

// Vercel cron: runs daily at 2 AM UTC
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await discoveryEngine.runFullDiscovery({
      sources: ['seed', 'yc', 'github'],
      skipAtsDetection: true,
    });
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
