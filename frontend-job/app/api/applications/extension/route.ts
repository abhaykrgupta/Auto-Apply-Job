/**
 * GET /api/applications/extension
 * Returns applications submitted via the Chrome Co-Pilot extension.
 * Separate from main applications table (no job_id FK required).
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { extensionApplications } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apps = await db
    .select()
    .from(extensionApplications)
    .where(eq(extensionApplications.userId, session.user.id))
    .orderBy(desc(extensionApplications.appliedAt));

  return NextResponse.json(apps);
}
