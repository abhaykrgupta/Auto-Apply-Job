import { savedSearchSchema, savedSearchDeleteSchema } from '@/lib/validations/saved-searches';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { savedSearches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const searches = await db.select().from(savedSearches).orderBy(savedSearches.createdAt);
    return NextResponse.json(searches);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = savedSearchSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const body = parsed.data;
    const [search] = await db.insert(savedSearches).values(body).returning();
    return NextResponse.json(search);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const parsedDelete = savedSearchDeleteSchema.safeParse(await req.json());
    if (!parsedDelete.success) return NextResponse.json({ error: parsedDelete.error.flatten() }, { status: 400 });
    const { id } = parsedDelete.data;
    await db.delete(savedSearches).where(eq(savedSearches.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
