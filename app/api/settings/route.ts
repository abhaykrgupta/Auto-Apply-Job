import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db.select().from(settings);
    const obj: Record<string, unknown> = {};
    for (const row of rows) {
      obj[row.key] = row.value;
    }
    return NextResponse.json(obj);
  } catch (err) {
    // DB not configured yet
    return NextResponse.json({});
  }
}

import { settingsUpdateSchema } from '@/lib/validations/settings';

export async function POST(request: NextRequest) {
  try {
    const parsed = settingsUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    for (const [key, value] of Object.entries(body).filter(([, v]) => v !== null && v !== undefined)) {
      const existing = await db
        .select({ id: settings.id })
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value: value as any, updatedAt: new Date() })
          .where(eq(settings.key, key));
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
