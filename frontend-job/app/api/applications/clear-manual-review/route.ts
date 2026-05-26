import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { applications, resumes, profile } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only delete manual_review applications that belong to this user
  const [userProfile] = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  if (!userProfile) {
    return NextResponse.json({ deleted: 0 });
  }

  const userResumes = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.profileId, userProfile.id));

  if (!userResumes.length) {
    return NextResponse.json({ deleted: 0 });
  }

  const resumeIds = userResumes.map(r => r.id);

  await db
    .delete(applications)
    .where(
      inArray(applications.resumeId, resumeIds)
    );

  return NextResponse.json({ success: true });
}
