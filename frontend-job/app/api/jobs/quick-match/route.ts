import { quickMatchSchema } from '@/lib/validations/jobs';
import { NextRequest, NextResponse } from 'next/server';
import { scoreJobMatchEmbedding } from '@/lib/openai/embedding-matcher';
import { getActiveResumes, getResumes } from '@/lib/actions/resume';
import { findBestResume } from '@/lib/utils/resume-matcher';
import { getCopilotUser } from '@/lib/copilot-auth';
import { checkPlanLimit, incrementUsage } from '@/lib/rate-limit/plan-limits';

// Called by the Chrome extension to score a job on-the-fly
export async function POST(req: NextRequest) {
  try {
    const userId = await getCopilotUser(req);
    if (userId) {
      const limit = await checkPlanLimit(userId, 'quickMatchPerDay');
      if (!limit.allowed) {
        return NextResponse.json(
          { error: `Daily match limit reached (${limit.current}/${limit.limit}). Upgrade to Pro for unlimited matches.`, plan: limit.plan },
          { status: 429 },
        );
      }
      incrementUsage(userId, 'quickMatchPerDay', 'day');
    }

    const parsed = quickMatchSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const job = parsed.data;

    if (!job.title) {
      return NextResponse.json({ error: 'Job title required' }, { status: 400 });
    }

    const activeResumes = await getActiveResumes();
    const candidates = activeResumes.length > 0 ? activeResumes : await getResumes();
    const jobForMatch = { title: job.title ?? '', description: job.description ?? '', requirements: job.requirements };
    const picked = await findBestResume(`${jobForMatch.title} ${jobForMatch.description} ${jobForMatch.requirements ?? ''}`, candidates);
    const resume = picked?.resume ?? candidates[0];

    if (!resume?.parsedData) {
      return NextResponse.json({
        score: 0,
        strengths: [],
        weaknesses: [],
        recommendation: 'Upload and parse a resume first in Job Agent.',
      });
    }

    // Build a minimal job object for scoring
    const jobObj = {
      id: 'external',
      title: job.title ?? '',
      company: job.company ?? '',
      description: job.description ?? job.title,
      requirements: null,
      location: job.location ?? null,
      locationType: null,
      source: 'custom' as const,
      applyUrl: job.applyUrl ?? '',
      status: 'active' as const,
      externalId: null,
      companyId: null,
      companyLogo: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: 'USD',
      benefits: null,
      postedAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const match = await scoreJobMatchEmbedding(jobObj, resume.parsedData as Record<string, unknown>);

    return NextResponse.json({
      score: match.score,
      strengths: match.strengths ?? [],
      weaknesses: match.weaknesses ?? [],
      recommendation: match.recommendation,
      confidence: match.confidence,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Match failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
