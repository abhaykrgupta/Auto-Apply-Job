/**
 * Phase 1 — ATS Question Answer Cache
 *
 * ATS platforms like Greenhouse, Lever and Workday often ask the exact same
 * custom questions across hundreds of companies:
 *   "Why do you want to work here?"
 *   "What is your expected salary?"
 *   "Are you authorized to work in the US?"
 *
 * Instead of calling the LLM for each question on every application,
 * we store answers in the DB keyed by a normalized question hash.
 *
 * Token savings: If we apply to 200 jobs and 80% share 5 common questions,
 * that's 200 * 5 = 1000 LLM calls → 200 LLM calls (first occurrence only).
 */

import { db } from '@/lib/db';
import { answerCache } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { openai } from '@/lib/openai/client';
import { logger } from '@/lib/utils/logger';
import crypto from 'crypto';

/**
 * Normalizes a question for stable cache keying.
 * Strips punctuation, lowercases, trims whitespace.
 */
function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a stable hash for a question for use as a lookup key.
 */
function questionHash(question: string): string {
  return crypto
    .createHash('sha256')
    .update(normalizeQuestion(question))
    .digest('hex')
    .slice(0, 16); // First 16 chars — enough for uniqueness
}

/**
 * Tries to get a cached answer for a question.
 * Returns null if not found.
 */
export async function getCachedAnswer(question: string): Promise<string | null> {
  const hash = questionHash(question);
  try {
    const [row] = await db
      .select({ answer: answerCache.answer, hitCount: answerCache.hitCount, id: answerCache.id })
      .from(answerCache)
      .where(eq(answerCache.questionHash, hash))
      .limit(1);

    if (row) {
      // Increment hit count (fire-and-forget, not awaited)
      db.update(answerCache)
        .set({ hitCount: (row.hitCount ?? 0) + 1, lastUsedAt: new Date() })
        .where(eq(answerCache.id, row.id))
        .catch(() => {});
      logger.debug({ hash, question: question.slice(0, 60) }, '[AnswerCache] Cache HIT — 0 tokens used');
      return row.answer;
    }
    return null;
  } catch (err) {
    logger.warn({ err }, '[AnswerCache] Cache lookup failed');
    return null;
  }
}

/**
 * Stores a generated answer in the cache for future reuse.
 */
export async function setCachedAnswer(question: string, answer: string, context?: string): Promise<void> {
  const hash = questionHash(question);
  const normalized = normalizeQuestion(question);
  try {
    await db
      .insert(answerCache)
      .values({
        questionHash: hash,
        questionNormalized: normalized,
        questionOriginal: question.slice(0, 500),
        answer,
        context: context?.slice(0, 200),
        hitCount: 0,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: answerCache.questionHash,
        set: { answer, lastUsedAt: new Date() },
      });
    logger.debug({ hash }, '[AnswerCache] Stored new answer');
  } catch (err) {
    logger.warn({ err }, '[AnswerCache] Failed to store answer');
  }
}

export interface AtsQuestion {
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
  options?: string[];
}

/**
 * Given a list of ATS form questions, generates answers for all of them.
 * Hits cache first — only calls the LLM for cache misses.
 * Returns a map of question label → answer.
 */
export async function generateAnswers(
  questions: AtsQuestion[],
  resumeSummary: string,
  jobTitle: string,
  companyName: string,
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  const uncachedQuestions: AtsQuestion[] = [];

  // Pass 1: Cache lookup
  for (const q of questions) {
    const cached = await getCachedAnswer(q.label);
    if (cached !== null) {
      results[q.label] = cached;
    } else {
      uncachedQuestions.push(q);
    }
  }

  if (uncachedQuestions.length === 0) {
    logger.info({ count: questions.length }, '[AnswerCache] All answers served from cache — 0 LLM tokens used');
    return results;
  }

  // Pass 2: Batch the uncached questions into ONE LLM call
  const questionsJson = JSON.stringify(
    uncachedQuestions.map(q => ({
      label: q.label,
      type: q.type,
      options: q.options ?? [],
    }))
  );

  const systemPrompt = `You are filling out a job application form on behalf of a candidate. 
Given their resume summary and a list of form questions, generate realistic, professional answers.
For select/radio/checkbox fields, pick from the provided options.
Output ONLY a valid JSON object mapping each question label to its answer string. No markdown.`;

  const userPrompt = `APPLYING FOR: ${jobTitle} at ${companyName}
RESUME SUMMARY: ${resumeSummary.slice(0, 600)}
QUESTIONS: ${questionsJson}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // Use cheap model for form answers too
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const tokensUsed = response.usage?.total_tokens ?? 0;
    const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as Record<string, string>;

    logger.info({
      total: questions.length,
      fromCache: questions.length - uncachedQuestions.length,
      fromLLM: uncachedQuestions.length,
      tokensUsed,
    }, '[AnswerCache] Batch generated answers');

    // Store all new answers in cache
    for (const q of uncachedQuestions) {
      const answer = parsed[q.label];
      if (answer) {
        results[q.label] = answer;
        await setCachedAnswer(q.label, answer, `${jobTitle} at ${companyName}`);
      }
    }
  } catch (err) {
    logger.error({ err }, '[AnswerCache] Batch LLM call failed');
  }

  return results;
}
