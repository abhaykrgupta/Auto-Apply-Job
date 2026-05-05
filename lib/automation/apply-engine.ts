import { getBrowser } from './playwright-client';
import { detectFormType } from './form-detector';
import { db } from '@/lib/db';
import { applications, applicationLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { telegramService } from '@/lib/notifications/telegram-service';
import path from 'path';
import { mkdir } from 'fs/promises';

export interface ApplyOptions {
  requireConfirmation?: boolean;
  generateCoverLetter?: boolean;
}

export interface ApplicationResult {
  status: 'applied' | 'failed' | 'manual_review' | 'pending_confirmation';
  method: string;
  error?: string;
  screenshotPath?: string;
  logs: string[];
}

export async function applyToJob(
  applicationId: string,
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
    applyUrl: string;
    requirements: string | null;
  },
  resume: {
    id: string;
    filePath: string;
    parsedData: Record<string, unknown> | null;
  },
  options: ApplyOptions = {}
): Promise<ApplicationResult> {
  const logs: string[] = [];
  const browser = await getBrowser();
  const page = await browser.newPage();
  let screenshotPath: string | undefined;

  const log = (msg: string) => {
    logs.push(msg);
    logger.info(msg);
  };

  try {
    log(`Navigating to ${job.applyUrl}`);
    await page.goto(job.applyUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Take initial screenshot
    const screenshotDir = path.join(process.cwd(), 'public', 'screenshots');
    await mkdir(screenshotDir, { recursive: true });
    screenshotPath = path.join(screenshotDir, `${applicationId}-start.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const formType = await detectFormType(page);
    log(`Detected form type: ${formType}`);

    if (formType === 'unknown' || formType === 'complex') {
      await db
        .update(applications)
        .set({ status: 'manual_review', screenshotPath, errorMessage: 'Complex form detected' })
        .where(eq(applications.id, applicationId));

      await db.insert(applicationLogs).values({
        applicationId,
        level: 'warn',
        message: 'Complex form — manual review required',
      });

      return { status: 'manual_review', method: 'auto', logs, screenshotPath };
    }

    if (options.requireConfirmation || process.env.APPLY_AUTO_SUBMIT !== 'true') {
      await db
        .update(applications)
        .set({ status: 'manual_review', screenshotPath })
        .where(eq(applications.id, applicationId));

      return { status: 'pending_confirmation', method: 'auto', logs, screenshotPath };
    }

    // Basic form filling for standard forms
    const parsed = resume.parsedData as {
      name?: string; email?: string; phone?: string;
      experience?: Array<{ title: string; company: string }>;
      skills?: string[];
    } | null;

    if (parsed) {
      const nameParts = (parsed.name ?? '').split(' ');
      await page.fill('input[name*="first"], input[id*="first"], input[placeholder*="First"]', nameParts[0] ?? '').catch(() => {});
      await page.fill('input[name*="last"], input[id*="last"], input[placeholder*="Last"]', nameParts.slice(1).join(' ') ?? '').catch(() => {});
      await page.fill('input[type="email"], input[name*="email"]', parsed.email ?? '').catch(() => {});
      await page.fill('input[type="tel"], input[name*="phone"]', parsed.phone ?? '').catch(() => {});

      // Upload resume file
      const fileInput = await page.$('input[type="file"]');
      if (fileInput && resume.filePath) {
        await fileInput.setInputFiles(resume.filePath).catch(() => {});
        log('Resume file uploaded');
      }
    }

    screenshotPath = path.join(screenshotDir, `${applicationId}-filled.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Click submit
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")').catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});

    screenshotPath = path.join(screenshotDir, `${applicationId}-final.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check for success
    const bodyText = (await page.textContent('body'))?.toLowerCase() ?? '';
    const success = ['application submitted', 'thank you for applying', 'application received', 'successfully applied'].some((s) => bodyText.includes(s));

    const status = success ? 'applied' : 'manual_review';

    await db
      .update(applications)
      .set({
        status,
        screenshotPath,
        appliedAt: success ? new Date() : undefined,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      })
      .where(eq(applications.id, applicationId));

    await db.insert(applicationLogs).values({
      applicationId,
      level: 'info',
      message: success ? 'Application submitted successfully' : 'Submission unclear — manual review',
    });

    log(`Result: ${status}`);
    telegramService.notifyApplicationStatus(job, status).catch(() => {});
    return { status, method: 'auto', logs, screenshotPath };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    log(`Error: ${error}`);

    await db
      .update(applications)
      .set({ status: 'failed', errorMessage: error, lastAttemptAt: new Date() })
      .where(eq(applications.id, applicationId));

    await db.insert(applicationLogs).values({
      applicationId,
      level: 'error',
      message: error,
    });

    telegramService.notifyApplicationStatus(job, 'failed').catch(() => {});
    return { status: 'failed', method: 'auto', error, logs, screenshotPath };
  } finally {
    await page.close();
  }
}
