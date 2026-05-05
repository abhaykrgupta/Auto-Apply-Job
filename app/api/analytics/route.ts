import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEngine, type TimeRange } from '@/lib/analytics/analytics-engine';

import { analyticsDateRangeSchema } from '@/lib/validations/analytics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = analyticsDateRangeSchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const range = (request.nextUrl.searchParams.get('range') as TimeRange) || 'week';
    const engine = new AnalyticsEngine();
    const stats = await engine.getAdvancedStats(range);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analytics failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
