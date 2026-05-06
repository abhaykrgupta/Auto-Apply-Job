import { NextResponse } from 'next/server';
import { insightsGenerator } from '@/lib/intelligence/insights-generator';

/**
 * GET /api/analytics/insights
 * Returns AI-generated application performance insights.
 */
export async function GET() {
  try {
    const report = await insightsGenerator.generate();
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate insights';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
