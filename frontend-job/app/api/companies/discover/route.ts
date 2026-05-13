import { companyDiscoverSchema } from '@/lib/validations/companies';
import { NextRequest, NextResponse } from 'next/server';
import { discoveryEngine } from '@/lib/company-discovery/discovery-engine';

export async function POST(req: NextRequest) {
  try {
    const parsed = companyDiscoverSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;
    const sources = (body.sources as any[]) ?? ['seed', 'yc', 'github'];

    const result = await discoveryEngine.runFullDiscovery({
      sources,
      skipAtsDetection: body.skipAtsDetection ?? true,
      limit: body.limit ?? 50,
    });

    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Discovery failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
