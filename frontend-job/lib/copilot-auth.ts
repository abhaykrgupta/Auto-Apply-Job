/**
 * copilot-auth.ts — Auth helper for Co-Pilot extension API routes
 *
 * Extension requests use Bearer token auth instead of session cookies.
 * This helper tries session first, then falls back to Bearer token lookup.
 */
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { extensionTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCopilotUser(req: NextRequest): Promise<string | null> {
  // 1. Try session (dashboard requests)
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  // 2. Try Bearer token (extension requests)
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const [row] = await db
    .select({ userId: extensionTokens.userId })
    .from(extensionTokens)
    .where(eq(extensionTokens.token, token))
    .limit(1);

  if (!row) return null;

  // Touch lastUsedAt (fire-and-forget)
  db.update(extensionTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(extensionTokens.token, token))
    .catch(() => {});

  return row.userId;
}
