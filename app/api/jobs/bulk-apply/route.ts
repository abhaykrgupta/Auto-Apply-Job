import { bulkApplyBodySchema } from '@/lib/validations/jobs';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobMatches, jobs, applications, settings } from '@/lib/db/schema';
import { eq, and, gte, inArray } from 'drizzle-orm';
import { getResumeById } from '@/lib/actions/resume';
import { createApplication } from '@/lib/actions/applications';
import { applyToJob } from '@/lib/automation/apply-engine';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const parsed = bulkApplyBodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { resumeId, minMatchScore: overrideScore } = parsed.data;
    
    if (!resumeId) {
      return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
    }

    const resume = await getResumeById(resumeId);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Get minMatchScore from settings if not provided
    let minScore = overrideScore;
    if (!minScore) {
      const dbSettings = await db.select().from(settings).where(eq(settings.key, 'minMatchScore'));
      minScore = dbSettings.length > 0 ? Number(dbSettings[0].value) : 70;
    }

    // Get maxConcurrent from settings
    const maxConcurrentSetting = await db.select().from(settings).where(eq(settings.key, 'maxConcurrent'));
    const maxConcurrent = maxConcurrentSetting.length > 0 ? Number(maxConcurrentSetting[0].value) : 3;

    // Find all matches meeting the threshold
    const matches = await db
      .select({
        jobId: jobs.id,
        title: jobs.title,
        company: jobs.company,
        description: jobs.description,
        applyUrl: jobs.applyUrl,
        requirements: jobs.requirements,
        score: jobMatches.score
      })
      .from(jobMatches)
      .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
      .where(
        and(
          eq(jobMatches.resumeId, resumeId),
          gte(jobMatches.score, minScore),
          eq(jobs.status, 'active')
        )
      );

    if (matches.length === 0) {
      return NextResponse.json({ queued: 0, message: 'No jobs meet the minimum match score threshold.' });
    }

    // Filter out jobs already applied to
    const existingApps = await db
      .select({ jobId: applications.jobId })
      .from(applications)
      .where(eq(applications.resumeId, resumeId));
      
    const appliedJobIds = new Set(existingApps.map(a => a.jobId));
    
    const jobsToApply = matches.filter(m => !appliedJobIds.has(m.jobId));

    if (jobsToApply.length === 0) {
      return NextResponse.json({ queued: 0, message: 'Already applied to all matching jobs.' });
    }

    // Start background processing (floating promise)
    processBulkApplications(jobsToApply, resume, maxConcurrent).catch(err => {
      logger.error({ err }, 'Background bulk application process failed');
    });

    return NextResponse.json({ 
      queued: jobsToApply.length, 
      message: `Successfully queued ${jobsToApply.length} jobs for auto-apply.` 
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bulk apply failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function processBulkApplications(jobsToApply: any[], resume: any, maxConcurrent: number) {
  logger.info(`Starting bulk application for ${jobsToApply.length} jobs with concurrency ${maxConcurrent}`);
  
  // Create application records immediately to prevent duplicate runs
  const applicationRecords = [];
  for (const job of jobsToApply) {
    const app = await createApplication(job.jobId, resume.id);
    applicationRecords.push({ ...job, applicationId: app.id });
  }

  // Process in chunks/concurrent limits
  for (let i = 0; i < applicationRecords.length; i += maxConcurrent) {
    const chunk = applicationRecords.slice(i, i + maxConcurrent);
    
    await Promise.allSettled(chunk.map(async (job) => {
      try {
        await applyToJob(
          job.applicationId,
          {
            id: job.jobId,
            title: job.title,
            company: job.company,
            description: job.description,
            applyUrl: job.applyUrl,
            requirements: job.requirements,
          },
          {
            id: resume.id,
            filePath: resume.filePath,
            parsedData: resume.parsedData as Record<string, unknown> | null,
          }
        );
      } catch (err) {
        logger.error({ err, jobId: job.jobId }, 'Error applying to job during bulk process');
      }
    }));
    
    // Optional delay between chunks to avoid rate limits
    if (i + maxConcurrent < applicationRecords.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  logger.info('Completed bulk application process');
}
