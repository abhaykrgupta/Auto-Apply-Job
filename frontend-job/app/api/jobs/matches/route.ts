import { getJobMatches } from '@/lib/actions/jobs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { resumes, profile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('resumeId');
    if (!resumeId) return NextResponse.json({ error: 'resumeId required' }, { status: 400 });

    // Verify the resume belongs to the requesting user
    const [userProfile] = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.userId, session.user.id))
      .limit(1);

    if (userProfile) {
      const [resume] = await db
        .select({ id: resumes.id })
        .from(resumes)
        .where(eq(resumes.id, resumeId))
        .limit(1);

      if (resume) {
        const [resumeProfile] = await db
          .select({ profileId: resumes.profileId })
          .from(resumes)
          .where(eq(resumes.id, resumeId))
          .limit(1);

        if (resumeProfile?.profileId !== userProfile.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const matches = await getJobMatches(resumeId);
    const res = NextResponse.json(matches);
    res.headers.set('X-RateLimit-Limit', '100');
    res.headers.set('X-RateLimit-Window', '3600');
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch matches';
    console.error('[/api/jobs/matches GET]', message);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
