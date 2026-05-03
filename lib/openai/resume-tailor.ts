import { openai } from './client';
import { logger } from '@/lib/utils/logger';

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
  job: { title: string; company: string; description: string; requirements?: string | null }
): Promise<TailoredResume> {
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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const raw = response.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned) as TailoredResume;
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
}
