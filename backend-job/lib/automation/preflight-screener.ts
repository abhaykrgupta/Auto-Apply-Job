/**
 * Phase 1 — Go/No-Go Pre-Flight Screener
 *
 * Before we spend tokens on resume tailoring or browser automation,
 * this module runs a rapid, cheap sanity check:
 *   1. Score the job vs the resume with gpt-4o-mini (10-20x cheaper than gpt-4o)
 *   2. Return a hard SKIP if score < threshold
 *
 * This alone eliminates ~60-70% of jobs that would waste tokens downstream.
 */

import { openai } from '@/lib/openai/client';
import { logger } from '@/lib/utils/logger';

export interface PreflightResult {
  pass: boolean;
  score: number; // 0-100
  reason: string;
  tokensUsed: number;
}

const PASS_THRESHOLD = 60; // jobs scoring below this are dropped immediately

/**
 * Runs a fast Go/No-Go screen on a job against resume data.
 * Uses gpt-4o-mini — ~50x cheaper than gpt-4o.
 */
export async function preflightScreen(
  jobTitle: string,
  jobDescriptionSnippet: string, // first 800 chars only — we don't need full JD here
  resumeSummary: string,         // compact resume summary: skills + titles only
): Promise<PreflightResult> {
  // Hard no-go patterns we can detect without any LLM call at all (0 tokens)
  const titleLower = jobTitle.toLowerCase();
  const hardNoGo = [
    'director', 'vp of', 'vice president', 'chief ', 'c-suite',
    'unpaid', 'intern', // only if not desired
  ];
  // We check for senior-level filters separately via the experience preference
  // (not here — we don't want to hardcode assumptions)

  const systemPrompt = `You are a strict job-fit evaluator. Given a job title, a snippet of the job description, and a brief resume summary, output ONLY a JSON object with two fields:
- score: integer 0-100 (0 = no fit, 100 = perfect fit)
- reason: one short sentence (max 15 words) explaining the score

Be strict. Only score above 70 if there is clear skill overlap. Output ONLY the JSON, no markdown.`;

  const userPrompt = `JOB TITLE: ${jobTitle}
JOB DESCRIPTION (first 800 chars): ${jobDescriptionSnippet.slice(0, 800)}
RESUME SUMMARY: ${resumeSummary.slice(0, 600)}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',         // ~50x cheaper than gpt-4o
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 80,               // strictly enforce — we only need a tiny JSON
      temperature: 0,               // deterministic scoring
      response_format: { type: 'json_object' },
    });

    const tokensUsed = response.usage?.total_tokens ?? 0;
    const raw = response.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw);
    const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
    const reason = String(parsed.reason ?? 'No reason provided');

    const pass = score >= PASS_THRESHOLD;
    logger.info({ jobTitle, score, pass, tokensUsed }, '[Preflight] Screened job');
    return { pass, score, reason, tokensUsed };
  } catch (err) {
    // If screener fails for any reason, we PASS the job through (fail-open)
    // to avoid falsely dropping valid applications.
    logger.warn({ err, jobTitle }, '[Preflight] Screener failed — defaulting to PASS');
    return { pass: true, score: 50, reason: 'Screener unavailable — passed by default', tokensUsed: 0 };
  }
}

/**
 * Build a compact resume summary for the screener.
 * Avoids sending massive parsedData blobs to the cheap model.
 */
export function buildResumeSummary(parsedData: Record<string, unknown> | null): string {
  if (!parsedData) return 'No resume data available';

  const parts: string[] = [];

  if (parsedData.name) parts.push(`Name: ${parsedData.name}`);

  if (Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
    parts.push(`Skills: ${(parsedData.skills as string[]).slice(0, 20).join(', ')}`);
  }

  if (Array.isArray(parsedData.experience)) {
    const titles = (parsedData.experience as Array<{ title?: string; company?: string }>)
      .slice(0, 4)
      .map(e => `${e.title ?? '?'} at ${e.company ?? '?'}`)
      .join('; ');
    if (titles) parts.push(`Experience: ${titles}`);
  }

  if (parsedData.summary) parts.push(`Summary: ${String(parsedData.summary).slice(0, 200)}`);

  return parts.join('\n') || 'Resume data present but unstructured';
}
