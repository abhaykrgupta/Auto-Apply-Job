/**
 * GET  /api/copilot/token  — returns existing token (or creates one) for the logged-in user
 * DELETE /api/copilot/token — revokes the token
 *
 * Used by the "Connect Extension" flow in the dashboard.
 * The token is passed to the extension which stores it in chrome.storage.local.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { extensionTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if token exists
  const [existing] = await db
    .select()
    .from(extensionTokens)
    .where(eq(extensionTokens.userId, userId))
    .limit(1);

  if (existing) {
    // Update lastUsedAt
    await db
      .update(extensionTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(extensionTokens.userId, userId));

    return NextResponse.json({ token: existing.token });
  }

  // Create a new token
  const token = `ja_ext_${randomBytes(32).toString('hex')}`;
  await db.insert(extensionTokens).values({ userId, token });

  return NextResponse.json({ token });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db
    .delete(extensionTokens)
    .where(eq(extensionTokens.userId, session.user.id));

  return NextResponse.json({ success: true });
}
