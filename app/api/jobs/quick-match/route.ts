import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resumes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { scoreJobMatch } from '@/lib/openai/job-matcher';

// Called by the Chrome extension to score a job on-the-fly
export async function POST(req: NextRequest) {
  try {
    const job = await req.json();

    if (!job.title) {
      return NextResponse.json({ error: 'Job title required' }, { status: 400 });
    }

    // Get active resume
    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.isActive, true))
      .limit(1);

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

    const match = await scoreJobMatch(jobObj, resume);

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
