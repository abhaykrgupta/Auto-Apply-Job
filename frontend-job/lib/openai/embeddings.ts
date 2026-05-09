import { openai } from './client';
import { rateLimitedOpenAI } from './rate-limiter';
import { embeddingCacheService } from './embedding-cache';
import { trackAiUsage } from './usage-tracker';

const MODEL = 'text-embedding-3-small';

export async function getEmbedding(text: string): Promise<number[]> {
  // Check cache before calling API
  const cached = await embeddingCacheService.get(text);
  if (cached) {
    trackAiUsage({
      operationType: 'embedding',
      model: MODEL,
      tokensInput: 0,
      tokensOutput: 0,
      latencyMs: 0,
      cacheHit: true,
      success: true,
    }).catch(() => {});
    return cached;
  }

  const startTime = Date.now();
  const response = await rateLimitedOpenAI(() => openai.embeddings.create({
    model: MODEL,
    input: text,
  }));
  const embedding = response.data[0].embedding;
  const latencyMs = Date.now() - startTime;

  // Persist to cache and track usage (both fire-and-forget)
  embeddingCacheService.set(text, embedding, response.usage?.total_tokens ?? 0).catch(() => {});
  trackAiUsage({
    operationType: 'embedding',
    model: MODEL,
    tokensInput: response.usage?.total_tokens ?? 0,
    tokensOutput: 0,
    latencyMs,
    cacheHit: false,
    success: true,
  }).catch(() => {});

  return embedding;
}
