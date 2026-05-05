import { getJobs } from '@/lib/actions/jobs';
import { jobSearchParamsSchema } from '@/lib/validations/jobs';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = jobSearchParamsSchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const allJobs = await getJobs();
    return NextResponse.json(allJobs);
  } catch {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
}

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export async function DELETE(req: NextRequest) {
  try {
    const parsed = bulkDeleteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await db.delete(jobs).where(inArray(jobs.id, parsed.data.ids));
    return NextResponse.json({ deleted: parsed.data.ids.length });
  } catch {
    return NextResponse.json({ error: 'Failed to delete jobs' }, { status: 500 });
  }
}
