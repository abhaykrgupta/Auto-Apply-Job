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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Jobs GET]', message);
    return NextResponse.json({ error: `Database error: ${message}` }, { status: 500 });
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
    const ids = parsed.data.ids;

    // Manual Cascade for bulk delete
    const { jobMatches, applications, generatedContent, applicationLogs } = await import('@/lib/db/schema');
    
    // Find all application IDs for these jobs
    const jobApps = await db.select({ id: applications.id }).from(applications).where(inArray(applications.jobId, ids));
    const appIds = jobApps.map(a => a.id);
    
    if (appIds.length > 0) {
        await db.delete(applicationLogs).where(inArray(applicationLogs.applicationId, appIds));
    }

    await db.delete(jobMatches).where(inArray(jobMatches.jobId, ids));
    await db.delete(applications).where(inArray(applications.jobId, ids));
    await db.delete(generatedContent).where(inArray(generatedContent.jobId, ids));

    await db.delete(jobs).where(inArray(jobs.id, ids));
    return NextResponse.json({ deleted: ids.length });
  } catch {
    return NextResponse.json({ error: 'Failed to delete jobs' }, { status: 500 });
  }
}
