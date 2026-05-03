import { openai } from './client';

export async function parseResume(fileContent: string) {
  const prompt = `You are a resume parser. Extract structured data from this resume.

Return ONLY valid JSON (no markdown, no explanation):

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "linkedin": "string or null",
  "github": "string or null",
  "portfolio": "string or null",
  "summary": "string",
  "skills": ["string"],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string or null",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduationDate": "string",
      "gpa": "string or null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null"
    }
  ],
  "certifications": ["string"],
  "languages": ["string"]
}

Resume content:
${fileContent}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content!);
}
