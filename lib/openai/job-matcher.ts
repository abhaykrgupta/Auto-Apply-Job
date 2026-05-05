import { openai } from './client';
import { rateLimitedOpenAI } from './rate-limiter';

export async function scoreJobMatch(job: {
  company: string;
  title: string;
  location: string | null;
  description: string;
  requirements: string | null;
}, resumeData: Record<string, unknown>) {
  const prompt = `You are a job matching AI. Analyze how well this candidate fits this job.

CANDIDATE PROFILE:
${JSON.stringify(resumeData, null, 2)}

JOB POSTING:
Company: ${job.company}
Title: ${job.title}
Location: ${job.location ?? 'Not specified'}
Description: ${job.description}
Requirements: ${job.requirements ?? 'Not specified'}

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

  const response = await rateLimitedOpenAI(() => openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  }));

  return JSON.parse(response.choices[0].message.content!);
}
