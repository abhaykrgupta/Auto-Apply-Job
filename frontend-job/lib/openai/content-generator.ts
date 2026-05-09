import { openai } from './client';
import { rateLimitedOpenAI } from './rate-limiter';

export async function generateCoverLetter(
  job: { company: string; title: string; description: string },
  resumeData: {
    name: string;
    experience: Array<{ title: string; company: string }>;
    skills: string[];
  }
) {
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

  return response.choices[0].message.content;
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

