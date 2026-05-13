import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { resumeProjects, profile } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function getProfileId(userId: string): Promise<string | null> {
  const [userProfile] = await db.select({ id: profile.id }).from(profile).where(eq(profile.userId, userId)).limit(1);
  return userProfile?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = await getProfileId(userId);
  if (!profileId) return NextResponse.json([]);

  const projects = await db
    .select()
    .from(resumeProjects)
    .where(eq(resumeProjects.profileId, profileId))
    .orderBy(desc(resumeProjects.updatedAt));

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = await getProfileId(userId);
  if (!profileId) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  const [project] = await db
    .insert(resumeProjects)
    .values({
      profileId,
      name:       body.name       ?? 'Untitled Resume',
      data:       body.data       ?? {},
      templateId: body.templateId ?? 'classic',
      status:     body.status     ?? 'draft',
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
