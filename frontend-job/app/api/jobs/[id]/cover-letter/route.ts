import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getJobById } from '@/lib/actions/jobs';
import { getActiveResumes, getResumes } from '@/lib/actions/resume';
import { findBestResume } from '@/lib/utils/resume-matcher';
import { checkRateLimit } from '@/lib/rate-limit/simple-rate-limiter';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!checkRateLimit(`cover-letter:${session.user.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 });
  }

  try {
    const { id } = await params;

    // Fetch job and resumes in parallel
    const [job, activeResumes] = await Promise.all([
      getJobById(id),
      getActiveResumes(),
    ]);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const candidates = activeResumes.length > 0 ? activeResumes : await getResumes();
    const picked = await findBestResume(`${job.title} ${job.description} ${job.requirements ?? ''}`, candidates);
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
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    });

    const coverLetter = res.choices[0].message.content ?? '';
    return NextResponse.json({ coverLetter, jobTitle: job.title, company: job.company });
  } catch (err) {
    console.error('[cover-letter]', err);
    return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 });
  }
}
