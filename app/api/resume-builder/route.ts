import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resumeProjects, profile } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function getOrCreateProfile() {
  const profiles = await db.select().from(profile).limit(1);
  if (profiles.length > 0) return profiles[0];
  const [p] = await db.insert(profile).values({ name: 'User', email: 'user@example.com' }).returning();
  return p;
}

export async function GET() {
  try {
    const p = await getOrCreateProfile();
    const projects = await db.select().from(resumeProjects)
      .where(eq(resumeProjects.profileId, p.id))
      .orderBy(desc(resumeProjects.updatedAt));
    return NextResponse.json(projects);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const p = await getOrCreateProfile();
    const [project] = await db.insert(resumeProjects).values({
      profileId: p.id,
      name: body.name || 'Untitled Resume',
      data: body.data || {},
      templateId: body.templateId || 'classic',
    }).returning();
    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
