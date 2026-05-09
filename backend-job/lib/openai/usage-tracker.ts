import { db } from '@/lib/db';
import { aiUsageLogs } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

// ── Pricing constants (USD per token) ────────────────────────────────────────
// Update when OpenAI changes pricing.
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o':               { input: 0.0000025, output: 0.00001  },
  'gpt-4o-mini':          { input: 0.00000015, output: 0.0000006 },
  'gpt-4-turbo':          { input: 0.00001,   output: 0.00003  },
  'gpt-3.5-turbo':        { input: 0.0000005, output: 0.0000015 },
  'text-embedding-3-small': { input: 0.00000002, output: 0     },
  'text-embedding-3-large': { input: 0.00000013, output: 0     },
};

function calcCost(model: string, tokensInput: number, tokensOutput: number): number {
  const p = PRICING[model] ?? { input: 0, output: 0 };
  return p.input * tokensInput + p.output * tokensOutput;
}

export type AiOperationType =
  | 'resume_parse'
  | 'job_match'
  | 'tailoring'
  | 'cover_letter'
  | 'scrape_extract'
  | 'embedding'
  | 'form_detect'
  | 'screening_answer'
  | 'resume_builder';

export interface TrackUsageOptions {
  operationType: AiOperationType;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  cacheHit?: boolean;
  retryCount?: number;
  relatedEntityId?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Fire-and-forget AI usage logger.
 * Never throws — a logging failure must never break the main operation.
 *
 * Usage:
 *   trackAiUsage({ operationType: 'job_match', model: 'gpt-4o', ... }).catch(() => {});
 */
export async function trackAiUsage(opts: TrackUsageOptions): Promise<void> {
  try {
    const costUsd = calcCost(opts.model, opts.tokensInput, opts.tokensOutput);

    await db.insert(aiUsageLogs).values({
      operationType: opts.operationType,
      model: opts.model,
      tokensInput: opts.tokensInput,
      tokensOutput: opts.tokensOutput,
      costUsd,
      latencyMs: opts.latencyMs,
      cacheHit: opts.cacheHit ?? false,
      retryCount: opts.retryCount ?? 0,
      relatedEntityId: opts.relatedEntityId ?? null,
      success: opts.success ?? true,
      errorMessage: opts.errorMessage ?? null,
    });

    logger.debug(
      {
        op: opts.operationType,
        model: opts.model,
        tokensIn: opts.tokensInput,
        tokensOut: opts.tokensOutput,
        cost: `$${costUsd.toFixed(6)}`,
        latencyMs: opts.latencyMs,
        cacheHit: opts.cacheHit,
      },
      'AI usage tracked'
    );
  } catch (err) {
    // Non-critical — do not propagate
    logger.debug({ err }, 'Failed to write ai_usage_log — non-critical');
  }
}

/**
 * Convenience wrapper: measures latency automatically and extracts usage
 * from an OpenAI response object.
 *
 * Usage:
 *   const response = await rateLimitedOpenAI(() => openai.chat.completions.create({...}));
 *   trackUsageFromResponse('job_match', 'gpt-4o', response, startTime, { relatedEntityId: jobId });
 */
export function trackUsageFromResponse(
  operationType: AiOperationType,
  model: string,
  response: { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null },
  startTimeMs: number,
  extra: Partial<Pick<TrackUsageOptions, 'cacheHit' | 'relatedEntityId' | 'retryCount'>> = {}
): void {
  trackAiUsage({
    operationType,
    model,
    tokensInput: response.usage?.prompt_tokens ?? 0,
    tokensOutput: response.usage?.completion_tokens ?? 0,
    latencyMs: Date.now() - startTimeMs,
    cacheHit: extra.cacheHit ?? false,
    relatedEntityId: extra.relatedEntityId,
    retryCount: extra.retryCount ?? 0,
    success: true,
  }).catch(() => {});
}
