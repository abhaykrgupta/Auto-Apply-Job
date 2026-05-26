import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

async function requireAuth() {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** GET /api/linkedin/connect — returns current session status */
export async function GET() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Return generic "disconnected" if credentials are not configured — don't reveal which env vars are missing
  if (!process.env.LINKEDIN_EMAIL || !process.env.LINKEDIN_PASSWORD) {
    return NextResponse.json({ status: 'disconnected', ok: false });
  }

  const { SessionManager } = await import('@/lib/automation/session-manager');
  const sessionPath = await SessionManager.getStorageStatePath('linkedin.com');
  return NextResponse.json({ status: sessionPath ? 'connected' : 'disconnected', ok: !!sessionPath });
}

/** POST /api/linkedin/connect — triggers login and saves session */
export async function POST() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ensureLinkedInSession } = await import('@/lib/automation/linkedin-auth');
  const result = await ensureLinkedInSession();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

/** DELETE /api/linkedin/connect — clears saved session */
export async function DELETE() {
  const userId = await requireAuth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { SessionManager } = await import('@/lib/automation/session-manager');
  await SessionManager.clearSession('linkedin.com');
  return NextResponse.json({ ok: true, status: 'disconnected' });
}
