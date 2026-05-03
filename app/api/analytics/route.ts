import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEngine, type TimeRange } from '@/lib/analytics/analytics-engine';

export async function GET(request: NextRequest) {
  try {
    const range = (request.nextUrl.searchParams.get('range') as TimeRange) || 'week';
    const engine = new AnalyticsEngine();
    const stats = await engine.getAdvancedStats(range);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analytics failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
