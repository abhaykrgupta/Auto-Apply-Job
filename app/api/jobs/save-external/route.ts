import { saveExternalJobSchema } from '@/lib/validations/jobs';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';

// Called by the Chrome extension to save a job found externally
export async function POST(req: NextRequest) {
  try {
    const parsed = saveExternalJobSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { job } = parsed.data;

    if (!job?.title || !job?.applyUrl) {
      return NextResponse.json({ error: 'title and applyUrl required' }, { status: 400 });
    }

    await db
      .insert(jobs)
      .values({
        externalId: job.applyUrl,
        source: 'custom',
        company: job.company || 'Unknown',
        title: job.title,
        location: job.location || null,
        description: job.description || job.title,
        applyUrl: job.applyUrl,
        status: 'active',
        postedAt: new Date(),
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
