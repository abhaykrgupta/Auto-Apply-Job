import { db } from '@/lib/db';
import { embeddingCache } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { hashContent } from '@/lib/scrapers/dom-fingerprint';
import { logger } from '@/lib/utils/logger';

/**
 * Hash-based embedding deduplication cache backed by Postgres.
 *
 * Contract:
 *  - get(text)  → returns cached vector if available, null otherwise
 *  - set(text, embedding, tokenCount) → persists the vector (fire-and-forget safe)
 *
 * Cache entries are shared across ALL operations (resume matching, job embedding,
 * scraper AI calls) so duplicate content never costs tokens twice.
 */
export class EmbeddingCacheService {
  private readonly model: string;

  constructor(model = 'text-embedding-3-small') {
    this.model = model;
  }

  async get(text: string): Promise<number[] | null> {
    try {
      const hash = hashContent(text);
      const rows = await db
        .select({ embedding: embeddingCache.embedding })
        .from(embeddingCache)
        .where(eq(embeddingCache.contentHash, hash))
        .limit(1);

      if (!rows.length) return null;

      // Bump use count + lastUsedAt without blocking
      db.update(embeddingCache)
        .set({
          useCount: sql`${embeddingCache.useCount} + 1`,
          lastUsedAt: new Date(),
        })
        .where(eq(embeddingCache.contentHash, hash))
        .catch(() => {});

      logger.debug({ hash: hash.slice(0, 8) }, 'Embedding cache hit');
      return rows[0].embedding as number[];
    } catch (err) {
      logger.debug({ err }, 'Embedding cache lookup failed — will call API');
      return null;
    }
  }

  async set(text: string, embedding: number[], tokenCount = 0): Promise<void> {
    try {
      const hash = hashContent(text);
      await db
        .insert(embeddingCache)
        .values({
          contentHash: hash,
          model: this.model,
          embedding,
          tokenCount,
          useCount: 1,
          lastUsedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: embeddingCache.contentHash,
          set: {
            useCount: sql`${embeddingCache.useCount} + 1`,
            lastUsedAt: new Date(),
          },
        });
    } catch (err) {
      logger.debug({ err }, 'Failed to write embedding cache — non-critical');
    }
  }
}

export const embeddingCacheService = new EmbeddingCacheService();
