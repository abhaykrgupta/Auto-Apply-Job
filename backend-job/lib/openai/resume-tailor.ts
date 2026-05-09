import { openai } from './client';
import { rateLimitedOpenAI } from './rate-limiter';
import { logger } from '@/lib/utils/logger';
import { trackUsageFromResponse } from './usage-tracker';
import { validateTailoredResume } from '@/lib/automation/resume-truth-validator';

export interface TailoredResume {
  summary: string;
  tailoredBullets: Array<{
    original: string;
    tailored: string;
    reason: string;
  }>;
  skillsToHighlight: string[];
  skillsToAdd: string[];
  coverLetterHint: string;
  matchBoost: number; // estimated % boost in match score
}

export async function tailorResumeToJob(
  resumeData: any,
  job: { id?: string; title: string; company: string; description: string; requirements?: string | null },
  resumeId?: string
): Promise<TailoredResume> {
  const { db } = await import('@/lib/db');
  const { generatedContent } = await import('@/lib/db/schema');
  const { and, eq } = await import('drizzle-orm');

  // Check cache if we have jobId and resumeId
  if (job.id && resumeId) {
    const [cached] = await db.select()
      .from(generatedContent)
      .where(and(
        eq(generatedContent.jobId, job.id),
        eq(generatedContent.resumeId, resumeId),
        eq(generatedContent.contentType, 'tailored_resume')
      ))
      .limit(1);

    if (cached) {
      try {
        return JSON.parse(cached.content) as TailoredResume;
      } catch (e) {
        // Fallback to generation if cache parse fails
      }
    }
  }

  const prompt = `You are an expert resume coach and ATS optimization specialist.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Requirements: ${job.requirements ?? 'Not provided'}

Your task: Tailor this resume specifically for this job to maximize ATS score and recruiter appeal.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "A 2-3 sentence professional summary rewritten for this specific role",
  "tailoredBullets": [
    {
      "original": "exact original bullet from resume",
      "tailored": "rewritten version using keywords from job description",
      "reason": "why this change helps"
    }
  ],
  "skillsToHighlight": ["skill1", "skill2"],
  "skillsToAdd": ["skill you should mention if you have it", "certification to get"],
  "coverLetterHint": "One key angle to emphasize in your cover letter",
  "matchBoost": 15
}

Rules:
- Never fabricate experience. Only reframe existing experience using job's keywords
- Use exact keywords from the job description (ATS matching)
- Focus on impact: numbers, percentages, outcomes
- Keep bullets under 2 lines
- tailoredBullets should cover the 3-5 most impactful changes`;

  const startTime = Date.now();
  const response = await rateLimitedOpenAI(() => openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  }));

  trackUsageFromResponse('tailoring', 'gpt-4o', response, startTime);

  const raw = response.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed: TailoredResume;
  try {
    parsed = JSON.parse(cleaned) as TailoredResume;
  } catch {
    logger.error({ raw }, 'Failed to parse tailored resume JSON');
    return {
      summary: '',
      tailoredBullets: [],
      skillsToHighlight: [],
      skillsToAdd: [],
      coverLetterHint: '',
      matchBoost: 0,
    };
  }

  // ── Truth validation: revert any hallucinated content ────────────────────
  const validation = validateTailoredResume(resumeData, {
    tailoredBullets: parsed.tailoredBullets ?? [],
    skillsToHighlight: parsed.skillsToHighlight ?? [],
    skillsToAdd: parsed.skillsToAdd ?? [],
  });

  if (!validation.passed) {
    logger.warn(
      { violationCount: validation.violations.length, violations: validation.violations },
      'Resume truth violations detected — sanitized output'
    );
  }

  const finalTailoredResume = {
    ...parsed,
    tailoredBullets: validation.sanitizedBullets,
    skillsToHighlight: validation.sanitizedSkills,
  };

  // Save back to cache
  if (job.id && resumeId) {
    try {
      await db.insert(generatedContent).values({
        jobId: job.id,
        resumeId: resumeId,
        contentType: 'tailored_resume',
        prompt: 'system prompt',
        content: JSON.stringify(finalTailoredResume),
        approved: true,
      });
    } catch (e) {
      logger.error('Failed to cache tailored resume', e);
    }
  }

  return finalTailoredResume;
}
