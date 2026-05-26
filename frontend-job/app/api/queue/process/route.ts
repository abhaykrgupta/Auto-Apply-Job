import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { applications, jobs, resumes, settings } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { applyToJob } from '@/lib/automation/apply-engine';
import { logger } from '@/lib/utils/logger';

const MAX_CONCURRENT_GLOBAL = 10; // hard cap regardless of settings
const MAX_PER_USER = 5;           // per-user cap to prevent abuse

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Get maxConcurrent setting (user-scoped, capped at MAX_PER_USER)
    const maxConcurrentSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, `${userId}:maxConcurrent`));
    const requestedConcurrency = maxConcurrentSetting.length > 0
      ? Number(maxConcurrentSetting[0].value)
      : 3;
    const maxConcurrent = Math.min(requestedConcurrency, MAX_PER_USER);

    // Fetch only THIS user's pending applications (user isolation)
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
      .where(and(
        eq(applications.status, 'pending'),
        eq(resumes.profileId, userId), // only this user's resumes
      ))
      .limit(50); // prevent runaway queue

    if (pending.length === 0) {
      return NextResponse.json({ total: 0, message: 'No pending applications in queue.' });
    }

    const total = pending.length;

    processQueue(pending, maxConcurrent).catch(err => {
      logger.error({ err }, 'Queue processing failed');
    });

    return NextResponse.json({
      total,
      message: `Started processing ${total} pending application${total !== 1 ? 's' : ''} with concurrency ${maxConcurrent}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start queue';
    return NextResponse.json({ error: 'Queue start failed' }, { status: 500 });
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
