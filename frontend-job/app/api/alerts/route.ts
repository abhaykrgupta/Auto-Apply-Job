/**
 * GET    /api/alerts           — list alerts + unseen match count
 * POST   /api/alerts           — create alert { name, role, location, remote, minScore }
 * DELETE /api/alerts?id=xxx    — delete alert
 * PATCH  /api/alerts?id=xxx    — update alert or mark matches seen
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { jobAlerts, jobAlertMatches, jobs } from '@/lib/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts = await db
    .select()
    .from(jobAlerts)
    .where(eq(jobAlerts.userId, userId))
    .orderBy(desc(jobAlerts.createdAt));

  // Get unseen match counts per alert
  const unseenCounts = await db
    .select({ alertId: jobAlertMatches.alertId, cnt: count() })
    .from(jobAlertMatches)
    .where(eq(jobAlertMatches.seen, false))
    .groupBy(jobAlertMatches.alertId);

  const countMap = Object.fromEntries(unseenCounts.map((r) => [r.alertId, Number(r.cnt)]));

  return NextResponse.json(
    alerts.map((a) => ({ ...a, unseenCount: countMap[a.id] ?? 0 }))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, role, location, remote, minScore } = body;
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const [alert] = await db
    .insert(jobAlerts)
    .values({ userId, name, role, location, remote: !!remote, minScore: minScore ?? 75 })
    .returning();

  return NextResponse.json(alert, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await db.delete(jobAlerts).where(and(eq(jobAlerts.id, id), eq(jobAlerts.userId, userId)));
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const body = await req.json();

  // Mark all matches as seen for this alert
  if (body.markSeen) {
    await db
      .update(jobAlertMatches)
      .set({ seen: true })
      .where(eq(jobAlertMatches.alertId, id));
    return NextResponse.json({ success: true });
  }

  // Update alert settings
  const update: Record<string, unknown> = {};
  if (body.isActive !== undefined) update.isActive = body.isActive;
  if (body.minScore !== undefined) update.minScore = body.minScore;
  if (body.name)     update.name = body.name;

  if (Object.keys(update).length) {
    await db.update(jobAlerts).set(update).where(and(eq(jobAlerts.id, id), eq(jobAlerts.userId, userId)));
  }

  return NextResponse.json({ success: true });
}
