import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { settingsUpdateSchema } from '@/lib/validations/settings';

// Keys are namespaced as "userId:settingKey" to isolate per user
function userKey(userId: string, key: string) {
  return `${userId}:${key}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const prefix = `${userId}:`;
    const rows = await db.select().from(settings).where(like(settings.key, `${prefix}%`));
    const obj: Record<string, unknown> = {};
    for (const row of rows) {
      const key = row.key.slice(prefix.length);
      obj[key] = row.value;
    }
    return NextResponse.json(obj);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = settingsUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    for (const [rawKey, value] of Object.entries(body).filter(([, v]) => v !== null && v !== undefined)) {
      const key = userKey(userId, rawKey);
      const existing = await db.select({ id: settings.id }).from(settings).where(eq(settings.key, key)).limit(1);

      if (existing.length > 0) {
        await db.update(settings).set({ value: value as any, updatedAt: new Date() }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: value as any });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
