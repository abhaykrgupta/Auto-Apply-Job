import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applications, jobs, resumes, settings } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { applyToJob } from '@/lib/automation/apply-engine';
import { logger } from '@/lib/utils/logger';

export async function POST() {
  try {
    // Get maxConcurrent setting
    const maxConcurrentSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'maxConcurrent'));
    const maxConcurrent = maxConcurrentSetting.length > 0
      ? Number(maxConcurrentSetting[0].value)
      : 3;

    // Fetch all pending applications with their job and resume
    const pending = await db
      .select({
        applicationId: applications.id,
        jobId: applications.jobId,
        resumeId: applications.resumeId,
        jobTitle: jobs.title,
        jobCompany: jobs.company,
        jobDescription: jobs.description,
        jobApplyUrl: jobs.applyUrl,
        jobRequirements: jobs.requirements,
        resumeFilePath: resumes.filePath,
        resumeParsedData: resumes.parsedData,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(resumes, eq(applications.resumeId, resumes.id))
      .where(eq(applications.status, 'pending'));

    if (pending.length === 0) {
      return NextResponse.json({ total: 0, message: 'No pending applications in queue.' });
    }

    const total = pending.length;

    // Run in background so the response returns immediately
    processQueue(pending, maxConcurrent).catch(err => {
      logger.error({ err }, 'Queue processing failed');
    });

    return NextResponse.json({
      total,
      message: `Started processing ${total} pending application${total !== 1 ? 's' : ''} with concurrency ${maxConcurrent}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start queue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function processQueue(pending: any[], maxConcurrent: number) {
  logger.info(`Processing queue: ${pending.length} applications, concurrency ${maxConcurrent}`);

  for (let i = 0; i < pending.length; i += maxConcurrent) {
    const chunk = pending.slice(i, i + maxConcurrent);

    await Promise.allSettled(
      chunk.map(async (item) => {
        try {
          await applyToJob(
            item.applicationId,
            {
              id: item.jobId,
              title: item.jobTitle,
              company: item.jobCompany,
              description: item.jobDescription,
              applyUrl: item.jobApplyUrl,
              requirements: item.jobRequirements,
            },
            {
              id: item.resumeId,
              filePath: item.resumeFilePath,
              parsedData: item.resumeParsedData as Record<string, unknown> | null,
            }
          );
        } catch (err) {
          logger.error({ err, applicationId: item.applicationId }, 'Failed to process application');
        }
      })
    );

    if (i + maxConcurrent < pending.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  logger.info('Queue processing complete');
}
