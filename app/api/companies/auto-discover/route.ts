import { NextRequest, NextResponse } from 'next/server';
import { runAutoDiscovery, type DiscoverySource } from '@/lib/company-discovery/auto-discovery-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sources: DiscoverySource[] = body.sources ?? ['seed', 'yc', 'github', 'vc', 'wellfound'];
    const skipAtsDetection: boolean = body.skipAtsDetection ?? true;

    const result = await runAutoDiscovery({
      sources,
      skipAtsDetection,
      triggeredBy: 'manual',
    });

    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auto-discovery failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
