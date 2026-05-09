import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiUsageLogs } from '@/lib/db/schema';
import { gte, sql } from 'drizzle-orm';

/**
 * GET /api/analytics/ai-costs
 *
 * Returns aggregated AI cost data for the dashboard.
 * Query params:
 *   days  — lookback window in days (default: 7)
 */
export async function GET(request: NextRequest) {
  try {
    const days = Math.min(parseInt(request.nextUrl.searchParams.get('days') ?? '7', 10), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totals, byOperation, byModel, cacheStats] = await Promise.all([
      // Total cost + tokens in the window
      db
        .select({
          totalCostUsd: sql<number>`COALESCE(SUM(${aiUsageLogs.costUsd}), 0)`,
          totalTokensIn: sql<number>`COALESCE(SUM(${aiUsageLogs.tokensInput}), 0)`,
          totalTokensOut: sql<number>`COALESCE(SUM(${aiUsageLogs.tokensOutput}), 0)`,
          totalCalls: sql<number>`COUNT(*)`,
          avgLatencyMs: sql<number>`COALESCE(AVG(${aiUsageLogs.latencyMs}), 0)`,
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, since)),

      // Cost breakdown by operation type
      db
        .select({
          operationType: aiUsageLogs.operationType,
          costUsd: sql<number>`COALESCE(SUM(${aiUsageLogs.costUsd}), 0)`,
          calls: sql<number>`COUNT(*)`,
          cacheHits: sql<number>`SUM(CASE WHEN ${aiUsageLogs.cacheHit} THEN 1 ELSE 0 END)`,
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, since))
        .groupBy(aiUsageLogs.operationType),

      // Cost breakdown by model
      db
        .select({
          model: aiUsageLogs.model,
          costUsd: sql<number>`COALESCE(SUM(${aiUsageLogs.costUsd}), 0)`,
          calls: sql<number>`COUNT(*)`,
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, since))
        .groupBy(aiUsageLogs.model),

      // Cache effectiveness
      db
        .select({
          totalCalls: sql<number>`COUNT(*)`,
          cacheHits: sql<number>`SUM(CASE WHEN ${aiUsageLogs.cacheHit} THEN 1 ELSE 0 END)`,
          savedCostUsd: sql<number>`COALESCE(SUM(CASE WHEN ${aiUsageLogs.cacheHit} THEN ${aiUsageLogs.costUsd} ELSE 0 END), 0)`,
        })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, since)),
    ]);

    const cacheRow = cacheStats[0];
    const cacheHitRate = cacheRow.totalCalls > 0
      ? (Number(cacheRow.cacheHits) / Number(cacheRow.totalCalls)) * 100
      : 0;

    return NextResponse.json({
      windowDays: days,
      totals: totals[0],
      byOperation,
      byModel,
      cache: {
        hitRate: Math.round(cacheHitRate * 10) / 10,
        totalHits: cacheRow.cacheHits,
        estimatedSavedUsd: cacheRow.savedCostUsd,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch AI costs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
