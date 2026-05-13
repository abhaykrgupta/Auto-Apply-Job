import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { resumes, profile } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/** Resolve current user's profile, creating one if needed */
async function getOrCreateProfile(userId: string, name?: string | null, email?: string | null) {
  const [existing] = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(profile)
    .values({ userId, name: name ?? 'User', email: email ?? 'user@example.com' })
    .returning();
  return created;
}

// GET — list resumes for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userProfile = await getOrCreateProfile(session.user.id, session.user.name, session.user.email);

  const userResumes = await db
    .select({
      id:        resumes.id,
      label:     resumes.label,
      fileName:  resumes.fileName,
      fileUrl:   resumes.fileUrl,
      parsedData: resumes.parsedData,
      isActive:  resumes.isActive,
      version:   resumes.version,
      createdAt: resumes.createdAt,
      updatedAt: resumes.updatedAt,
      // filePath intentionally excluded — server disk path must never reach the client
    })
    .from(resumes)
    .where(eq(resumes.profileId, userProfile.id))
    .orderBy(resumes.createdAt);

  return NextResponse.json(userResumes);
}

// PATCH — update label or isActive for a resume owned by this user
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, isActive, label } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const userProfile = await getOrCreateProfile(session.user.id, session.user.name, session.user.email);

  // Verify ownership
  const [resume] = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.profileId, userProfile.id)))
    .limit(1);

  if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof isActive === 'boolean') updates.isActive = isActive;
  if (typeof label === 'string') updates.label = label.trim() || null;

  await db.update(resumes).set(updates).where(eq(resumes.id, id));
  return NextResponse.json({ ok: true });
}

// DELETE — delete a resume owned by this user
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const userProfile = await getOrCreateProfile(session.user.id, session.user.name, session.user.email);

  // Verify ownership before deleting
  const [resume] = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.profileId, userProfile.id)))
    .limit(1);

  if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

  await db.delete(resumes).where(eq(resumes.id, id));
  return NextResponse.json({ ok: true });
}
