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
    const body = await req.json();
    const [search] = await db.insert(savedSearches).values(body).returning();
    return NextResponse.json(search);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.delete(savedSearches).where(eq(savedSearches.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
