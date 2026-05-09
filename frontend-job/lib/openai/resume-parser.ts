import { openai } from './client';
import { rateLimitedOpenAI } from './rate-limiter';

export async function parseResume(fileContent: string) {
  const prompt = `You are an expert resume parser. Extract ALL structured data from this resume — do not omit any section or bullet point.

Return ONLY valid JSON (no markdown, no explanation). Extract every bullet point, every job, every project, every skill.

{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "location": "city, state or country",
  "linkedin": "linkedin URL or username or null",
  "github": "github URL or username or null",
  "website": "personal website URL or null",
  "summary": "professional summary or objective, empty string if none",
  "skills": ["every technical skill listed"],
  "softSkills": ["soft skills if listed separately"],
  "experience": [
    {
      "company": "company name",
      "title": "job title",
      "location": "city, state or Remote",
      "startDate": "Mon YYYY format e.g. Jan 2022",
      "endDate": "Mon YYYY or empty string if current",
      "current": true or false,
      "bullets": ["exact bullet point 1", "exact bullet point 2", "...all bullets"]
    }
  ],
  "education": [
    {
      "institution": "school name",
      "degree": "degree type e.g. B.S., M.S., Ph.D.",
      "field": "field of study",
      "startDate": "YYYY or Mon YYYY",
      "endDate": "YYYY or Mon YYYY",
      "gpa": "GPA value or null"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "project description",
      "technologies": ["tech1", "tech2"],
      "url": "project URL or null",
      "bullets": ["bullet 1", "bullet 2"]
    }
  ],
  "certifications": ["certification name with issuer if present"],
  "languages": ["language and proficiency level"]
}

IMPORTANT: Capture every single bullet point under each experience and project. Do not summarize or truncate.

Resume content:
${fileContent}`;

  const response = await rateLimitedOpenAI(() => openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  }));

  return JSON.parse(response.choices[0].message.content!);
}
