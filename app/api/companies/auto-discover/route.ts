import { companyAutoDiscoverSchema } from '@/lib/validations/companies';
import { NextRequest, NextResponse } from 'next/server';
import { runAutoDiscovery, type DiscoverySource } from '@/lib/company-discovery/auto-discovery-engine';

export async function POST(req: NextRequest) {
  try {
    const parsed = companyAutoDiscoverSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;
    const sources = (body.sources as DiscoverySource[]) ?? ['seed', 'yc', 'github', 'vc', 'wellfound'];
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
