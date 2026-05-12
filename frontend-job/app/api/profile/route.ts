import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  return NextResponse.json(row ?? null);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const [existing] = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(profile)
      .set({
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        bio: body.bio ?? null,
        linkedin: body.linkedin ?? null,
        github: body.github ?? null,
        portfolio: body.portfolio ?? null,
        remotePreference: body.remotePreference ?? null,
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        preferredRoles: body.preferredRoles ?? null,
        preferredLocations: body.preferredLocations ?? null,
        updatedAt: new Date(),
      })
      .where(eq(profile.userId, session.user.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(profile)
    .values({
      userId: session.user.id,
      name: body.name ?? session.user.name ?? '',
      email: body.email ?? session.user.email ?? '',
      phone: body.phone ?? null,
      bio: body.bio ?? null,
      linkedin: body.linkedin ?? null,
      github: body.github ?? null,
      portfolio: body.portfolio ?? null,
      remotePreference: body.remotePreference ?? null,
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      preferredRoles: body.preferredRoles ?? null,
      preferredLocations: body.preferredLocations ?? null,
    })
    .returning();

  return NextResponse.json(created);
}
