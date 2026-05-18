import { openai } from './client';
import { rateLimitedOpenAI } from './rate-limiter';
import { trackUsageFromResponse } from './usage-tracker';
import { wrapUntrusted, INJECTION_GUARD_INSTRUCTION, scanForInjection } from './prompt-guard';
import { logger } from '@/lib/utils/logger';

export async function scoreJobMatch(job: {
  company: string;
  title: string;
  location: string | null;
  description: string;
  requirements: string | null;
}, resumeData: Record<string, unknown>) {
  // Scan for injection attempts before passing to LLM
  const descScan = scanForInjection(job.description);
  const reqScan  = scanForInjection(job.requirements ?? '');
  if (!descScan.clean || !reqScan.clean) {
    logger.warn({ company: job.company, title: job.title, flagged: [...descScan.flaggedPatterns, ...reqScan.flaggedPatterns] },
      '[JobMatcher] Prompt injection pattern detected in job posting');
  }

  const systemPrompt = `You are a job matching AI. Analyze how well a candidate fits a job posting.
Your task: return a JSON match score based only on skills, experience, and qualifications.
${INJECTION_GUARD_INSTRUCTION}`;

  const userPrompt = `CANDIDATE PROFILE:
${wrapUntrusted('candidate_profile', JSON.stringify(resumeData, null, 2))}

JOB POSTING:
Company: ${job.company}
Title: ${job.title}
Location: ${job.location ?? 'Not specified'}
${wrapUntrusted('job_description', job.description)}
${wrapUntrusted('job_requirements', job.requirements ?? 'Not specified')}

Return ONLY valid JSON:
{
  "score": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendation": "string",
  "confidence": 0.0,
  "reasoning": "string"
}

score is 0-100, confidence is 0-1.`;

  const startTime = Date.now();
  const response = await rateLimitedOpenAI(() => openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  }));

  trackUsageFromResponse('job_match', 'gpt-4o', response, startTime);

  return JSON.parse(response.choices[0].message.content!);
}
