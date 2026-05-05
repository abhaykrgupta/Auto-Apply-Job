import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Manual Cascade: Delete related records first
    const { jobMatches, applications, generatedContent, applicationLogs } = await import('@/lib/db/schema');
    
    // Find application IDs for this job to delete logs
    const jobApps = await db.select({ id: applications.id }).from(applications).where(eq(applications.jobId, id));
    const appIds = jobApps.map(a => a.id);
    
    if (appIds.length > 0) {
      await db.delete(applicationLogs).where(inArray(applicationLogs.applicationId, appIds));
    }
    
    await db.delete(jobMatches).where(eq(jobMatches.jobId, id));
    await db.delete(applications).where(eq(applications.jobId, id));
    await db.delete(generatedContent).where(eq(generatedContent.jobId, id));
    
    // Finally delete the job
    await db.delete(jobs).where(eq(jobs.id, id));
    
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DELETE /api/jobs/${params}]`, message);
    return NextResponse.json({ error: `Database error: ${message}` }, { status: 500 });
  }
}
