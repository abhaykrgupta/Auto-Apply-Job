import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEngine, type TimeRange } from '@/lib/analytics/analytics-engine';
import { analyticsDateRangeSchema } from '@/lib/validations/analytics';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profile, resumes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = analyticsDateRangeSchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const range = (request.nextUrl.searchParams.get('range') as TimeRange) || 'week';

    let resumeIds: string[] = [];
    if (userId) {
      const [userProfile] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
      if (userProfile) {
        const userResumes = await db.select({ id: resumes.id }).from(resumes).where(eq(resumes.profileId, userProfile.id));
        resumeIds = userResumes.map((r) => r.id);
      }
    }

    const engine = new AnalyticsEngine(resumeIds);
    const stats = await engine.getAdvancedStats(range);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analytics failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
