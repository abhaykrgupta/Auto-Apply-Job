import { NextRequest, NextResponse } from 'next/server';
import { discoveryEngine } from '@/lib/company-discovery/discovery-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sources = body.sources ?? ['seed', 'yc', 'github'];

    const result = await discoveryEngine.runFullDiscovery({
      sources,
      skipAtsDetection: body.skipAtsDetection ?? true,
    });

    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Discovery failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
