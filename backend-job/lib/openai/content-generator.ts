import { openai } from './client';
import { rateLimitedOpenAI } from './rate-limiter';

export async function generateCoverLetter(
  job: { id?: string; company: string; title: string; description: string },
  resumeData: {
    id?: string;
    name: string;
    experience: Array<{ title: string; company: string }>;
    skills: string[];
  }
) {
  const { db } = await import('@/lib/db');
  const { generatedContent } = await import('@/lib/db/schema');
  const { and, eq } = await import('drizzle-orm');

  // Check cache if we have jobId and resumeId
  if (job.id && resumeData.id) {
    const [cached] = await db.select()
      .from(generatedContent)
      .where(and(
        eq(generatedContent.jobId, job.id),
        eq(generatedContent.resumeId, resumeData.id),
        eq(generatedContent.contentType, 'cover_letter')
      ))
      .limit(1);

    if (cached) {
      return cached.content;
    }
  }

  const prompt = `Write a compelling cover letter for this job application.

CANDIDATE: ${resumeData.name}
EXPERIENCE: ${resumeData.experience.map((e) => `${e.title} at ${e.company}`).join(', ')}
SKILLS: ${resumeData.skills.join(', ')}

JOB:
Company: ${job.company}
Title: ${job.title}
Description: ${job.description}

Requirements:
- Professional tone
- 3-4 paragraphs
- Highlight relevant experience
- Show enthusiasm for company
- No generic phrases

Return ONLY the cover letter text (no JSON, no markdown).`;

  const response = await rateLimitedOpenAI(() => openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  }));

  const content = response.choices[0].message.content;

  // Save back to cache
  if (content && job.id && resumeData.id) {
    try {
      await db.insert(generatedContent).values({
        jobId: job.id,
        resumeId: resumeData.id,
        contentType: 'cover_letter',
        prompt: 'system prompt',
        content,
        approved: true,
      });
    } catch (e) {
      console.error('Failed to cache cover letter', e);
    }
  }

  return content;
}

export async function generateScreeningAnswer(
  question: string,
  job: { company: string; title: string; description: string },
  resumeData: Record<string, unknown>
) {
  const prompt = `Answer this job application screening question professionally and concisely.

QUESTION: ${question}

JOB: ${job.title} at ${job.company}
DESCRIPTION: ${job.description}

CANDIDATE PROFILE:
${JSON.stringify(resumeData, null, 2)}

Return only the answer text, no explanation.`;

  const response = await rateLimitedOpenAI(() => openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  }));

  return response.choices[0].message.content;
}

