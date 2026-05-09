import { NextRequest, NextResponse } from 'next/server';

/** GET /api/linkedin/connect — returns current session status */
export async function GET() {
  const hasCredentials = !!(process.env.LINKEDIN_EMAIL && process.env.LINKEDIN_PASSWORD);
  if (!hasCredentials) {
    return NextResponse.json({ status: 'no_creds', ok: false });
  }

  const { SessionManager } = await import('@/lib/automation/session-manager');
  const sessionPath = await SessionManager.getStorageStatePath('linkedin.com');
  return NextResponse.json({ status: sessionPath ? 'connected' : 'disconnected', ok: !!sessionPath });
}

/** POST /api/linkedin/connect — triggers login and saves session */
export async function POST() {
  const { ensureLinkedInSession } = await import('@/lib/automation/linkedin-auth');
  const result = await ensureLinkedInSession();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

/** DELETE /api/linkedin/connect — clears saved session */
export async function DELETE() {
  const { SessionManager } = await import('@/lib/automation/session-manager');
  await SessionManager.clearSession('linkedin.com');
  return NextResponse.json({ ok: true, status: 'disconnected' });
}
