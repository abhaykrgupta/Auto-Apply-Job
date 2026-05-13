/**
 * POST /api/copilot/answer
 *
 * Called by the Chrome extension when it encounters a custom/unknown form field.
 * Returns a GPT-4o-mini generated draft answer the user can accept or edit.
 *
 * Body: {
 *   question: string        — the form field label / question text
 *   context: {
 *     title:   string       — job title
 *     company: string       — company name
 *     jd:      string       — job description excerpt (max 2000 chars)
 *   }
 *   profile: object         — extension profile flat object (optional, for personalization)
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCopilotUser } from '@/lib/copilot-auth';
import { openai } from '@/lib/openai/client';
import { checkPlanLimit, incrementUsage } from '@/lib/rate-limit/plan-limits';

const MAX_JD_CHARS    = 2000;
const MAX_ANSWER_CHARS = 400;

export async function POST(req: NextRequest) {
  const userId = await getCopilotUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = await checkPlanLimit(userId, 'copilotAnswersPerDay');
  if (!limit.allowed) {
    return NextResponse.json({ answer: '' }, { status: 200 }); // fail gracefully — user fills manually
  }
  incrementUsage(userId, 'copilotAnswersPerDay', 'day');

  const body = await req.json();
  const { question, context, profile } = body as {
    question: string;
    context?: { title?: string; company?: string; jd?: string };
    profile?: Record<string, string>;
  };

  if (!question?.trim()) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 });
  }

  const title   = context?.title   ?? 'this role';
  const company = context?.company ?? 'this company';
  const jd      = (context?.jd ?? '').slice(0, MAX_JD_CHARS);
  const summary = profile?.summary ?? '';
  const name    = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'the applicant';

  const systemPrompt = `You are helping ${name} write concise answers for job application form fields.
Write in first person, professional tone, 1–3 sentences maximum.
Never include placeholder brackets like [X years]. Use real information from the profile when available.
If the question is a yes/no, answer with just "Yes" or "No".
If the question asks for a number (years, salary), give a single number or short range.
If you don't have enough information, write a confident, generic but honest answer.`;

  const userPrompt = `Job: ${title} at ${company}
${jd ? `\nJob description excerpt:\n${jd}\n` : ''}
${summary ? `\nMy background: ${summary}\n` : ''}
Question: "${question}"

Write a concise answer (max ${MAX_ANSWER_CHARS} characters):`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.4,
    });

    const answer = completion.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ answer });
  } catch (err) {
    console.error('[copilot/answer]', err);
    return NextResponse.json({ answer: '' }, { status: 200 }); // fail gracefully — user fills manually
  }
}
