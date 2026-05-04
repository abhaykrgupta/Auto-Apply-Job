import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/actions/jobs';
import { getActiveResumes, getResumes } from '@/lib/actions/resume';
import { pickBestResume } from '@/lib/utils/resume-matcher';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const activeResumes = await getActiveResumes();
    const candidates = activeResumes.length > 0 ? activeResumes : await getResumes();
    const picked = pickBestResume(candidates, { title: job.title, description: job.description, requirements: job.requirements });
    const resume = picked?.resume ?? candidates[0];
    if (!resume?.parsedData) return NextResponse.json({ error: 'No parsed resume found. Upload a resume first.' }, { status: 400 });

    const openai = getOpenAI();
    const parsed = resume.parsedData as any;

    const prompt = `Write a professional, concise cover letter (3 short paragraphs, max 250 words) for this job application.

Job Title: ${job.title}
Company: ${job.company}
Job Description: ${(job.description ?? '').substring(0, 1500)}

Candidate Profile:
Name: ${parsed.name ?? 'Candidate'}
Skills: ${(parsed.skills ?? []).join(', ')}
Experience: ${(parsed.experience ?? []).slice(0, 3).map((e: any) => `${e.title} at ${e.company}`).join(', ')}

Write a genuine, non-generic cover letter. Do NOT use phrases like "I am writing to express my interest". Be direct and confident. Return ONLY the cover letter text, no subject line or date.`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    });

    const coverLetter = res.choices[0].message.content ?? '';
    return NextResponse.json({ coverLetter, jobTitle: job.title, company: job.company });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
