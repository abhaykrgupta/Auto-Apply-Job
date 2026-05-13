import { db } from '@/lib/db';
import { companyDiscoverySources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { discoveryEngine } from './discovery-engine';
import { logger } from '@/lib/utils/logger';

export type DiscoverySource = 'yc' | 'github' | 'vc' | 'wellfound' | 'seed' | 'inc42' | 'india-vcs' | 'nasscom';

export interface AutoDiscoveryOptions {
  sources?: DiscoverySource[];
  skipAtsDetection?: boolean;
  triggeredBy?: 'manual' | 'cron';
}

export interface AutoDiscoveryResult {
  total: number;
  newCompanies: number;
  sources: Record<string, number>;
  runIds: string[];
  durationMs: number;
}

/**
 * Runs a full multi-source company auto-discovery, recording each source run
 * in the `company_discovery_sources` table for audit/history.
 */
export async function runAutoDiscovery(
  options: AutoDiscoveryOptions = {}
): Promise<AutoDiscoveryResult> {
  const {
    sources = ['seed', 'yc', 'github', 'vc', 'wellfound', 'inc42', 'india-vcs', 'nasscom'],
    skipAtsDetection = true,
    triggeredBy = 'manual',
  } = options;

  const startTime = Date.now();
  const runIds: string[] = [];

  // Insert a "running" row for each source so progress is visible
  const insertedRows = await db
    .insert(companyDiscoverySources)
    .values(
      sources.map((source) => ({
        source,
        status: 'running',
        triggeredBy,
      }))
    )
    .returning({ id: companyDiscoverySources.id, source: companyDiscoverySources.source });

  const rowBySource = Object.fromEntries(insertedRows.map((r) => [r.source, r.id]));

  let totalDiscovered = 0;
  let totalNew = 0;
  const sourceResults: Record<string, number> = {};

  for (const source of sources) {
    const sourceStart = Date.now();
    const rowId = rowBySource[source];

    try {
      const result = await discoveryEngine.runFullDiscovery({
        sources: [source],
        skipAtsDetection,
      });

      const discovered = result.sources[source] ?? 0;
      sourceResults[source] = discovered;
      totalDiscovered += result.total;
      totalNew += result.newCompanies;

      await db
        .update(companyDiscoverySources)
        .set({
          status: 'done',
          discovered: result.total,
          newCompanies: result.newCompanies,
          durationMs: Date.now() - sourceStart,
        })
        .where(eq(companyDiscoverySources.id, rowId));

      runIds.push(rowId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, source }, `Auto-discovery failed for source: ${source}`);

      await db
        .update(companyDiscoverySources)
        .set({
          status: 'failed',
          errorMessage: message,
          durationMs: Date.now() - sourceStart,
        })
        .where(eq(companyDiscoverySources.id, rowId));

      sourceResults[source] = 0;
      runIds.push(rowId);
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info({ totalDiscovered, totalNew, durationMs }, 'Auto-discovery complete');

  return {
    total: totalDiscovered,
    newCompanies: totalNew,
    sources: sourceResults,
    runIds,
    durationMs,
  };
}
