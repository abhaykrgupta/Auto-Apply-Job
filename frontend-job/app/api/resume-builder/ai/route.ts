import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { rateLimitedOpenAI } from '@/lib/openai/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();

    if (action === 'generate-summary') {
      // data: { experience, education, skills }
      const { experience, education, skills } = data;
      const expStr = experience.map((e: any) => `${e.title} at ${e.company} (${e.startDate}–${e.current ? 'Present' : e.endDate})`).join('; ');
      const skillStr = skills?.technical?.slice(0, 10).join(', ') || '';

      const res = await rateLimitedOpenAI(() => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Write a professional resume summary (2-3 sentences, 50-80 words) for this candidate.

Experience: ${expStr}
Education: ${education.map((e: any) => `${e.degree} in ${e.field} from ${e.school}`).join('; ')}
Skills: ${skillStr}

Rules:
- Start with a strong adjective + role title
- Mention years of experience if clear from dates
- Include 2-3 key skills or technologies
- End with career goal or value proposition
- No "I" statements
- Return ONLY the summary text, no quotes or labels`
        }],
        temperature: 0.6,
        max_tokens: 200,
      }));

      return NextResponse.json({ result: res.choices[0].message.content?.trim() });
    }

    if (action === 'improve-bullets') {
      // data: { title, company, bullets }
      const { title, company, bullets } = data;
      const bulletStr = bullets.filter(Boolean).join('\n');

      const res = await rateLimitedOpenAI(() => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Rewrite these resume bullet points for a ${title} role at ${company} to be more impactful and ATS-optimized.

Original bullets:
${bulletStr}

Rules:
- Start each bullet with a strong action verb (Led, Built, Reduced, Increased, Launched, etc.)
- Add specific metrics/numbers where reasonable (%, $, count, time) — if none exist, use relative impact
- Keep each bullet under 2 lines
- Do NOT fabricate specific numbers that weren't in the original — use language like "significantly", "by X%" only if the original implies it
- Return ONLY the improved bullets, one per line, no dashes or bullets prefix, no numbering`
        }],
        temperature: 0.4,
        max_tokens: 500,
      }));

      const improved = res.choices[0].message.content?.trim().split('\n').filter(Boolean) ?? [];
      return NextResponse.json({ result: improved });
    }

    if (action === 'tailor') {
      // data: { resumeData, jobDescription }
      const { resumeData, jobDescription } = data;
      const { tailorResumeToJob } = await import('@/lib/openai/resume-tailor');
      const result = await tailorResumeToJob(resumeData, {
        title: 'Target Role',
        company: 'Target Company',
        description: jobDescription,
      });
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    // Surface rate-limit errors clearly so user knows to retry
    if (e?.status === 429 || e?.message?.includes('429') || e?.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'OpenAI rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    if (e?.status === 401 || e?.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key is invalid or missing. Check your .env.local file.' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: e.message || 'AI request failed' }, { status: 500 });
  }
}
