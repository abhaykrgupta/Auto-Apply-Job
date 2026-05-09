import { getBrowser } from './playwright-client';
import { detectFormType } from './form-detector';
import { detectCaptcha } from './captcha-detector';
import { classifyFailure, computeCooldownUntil } from './retry-classifier';
import { db } from '@/lib/db';
import { applications, applicationLogs, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { telegramService } from '@/lib/notifications/telegram-service';
import path from 'path';
import { mkdir } from 'fs/promises';

async function getApplySettings() {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = String(r.value);
  return {
    autoApplyEnabled: map['autoApplyEnabled'] === 'true',
    requireConfirmation: map['requireConfirmation'] !== 'false', // default true (safe)
  };
}

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
    // Read live settings from DB so UI toggles take effect immediately
    const applySettings = await getApplySettings();
    const autoApplyEnabled = applySettings.autoApplyEnabled;
    const requireConfirmation = options.requireConfirmation ?? applySettings.requireConfirmation;

    log(`Auto-apply enabled: ${autoApplyEnabled} | Require confirmation: ${requireConfirmation}`);

    if (!autoApplyEnabled) {
      await db
        .update(applications)
        .set({ status: 'manual_review', errorMessage: 'Auto-apply is disabled in Settings' })
        .where(eq(applications.id, applicationId));
      await db.insert(applicationLogs).values({
        applicationId, level: 'warn',
        message: 'Auto-apply is disabled. Enable it in Settings → Auto-Apply to let the bot fill and submit forms.',
      });
      return { status: 'manual_review', method: 'auto', logs };
    }

    // Validate URL before navigating — prevents file://, javascript:, data: attacks
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(job.applyUrl);
    } catch {
      throw new Error(`Invalid apply URL: ${job.applyUrl}`);
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(`Blocked unsafe URL protocol: ${parsedUrl.protocol}`);
    }

    log(`Navigating to ${parsedUrl.toString()}`);
    await page.goto(parsedUrl.toString(), { waitUntil: 'networkidle', timeout: 30000 });

    // Take initial screenshot
    const screenshotDir = path.join(process.cwd(), 'public', 'screenshots');
    await mkdir(screenshotDir, { recursive: true });
    screenshotPath = path.join(screenshotDir, `${applicationId}-start.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log('Screenshot taken: page loaded');

    // CAPTCHA / bot-protection detection — abort before wasting more Playwright time
    const captchaResult = await detectCaptcha(page);
    if (captchaResult.detected) {
      const reason = `CAPTCHA detected (${captchaResult.vendor ?? 'generic'}): ${captchaResult.reason}`;
      log(reason);
      await db
        .update(applications)
        .set({ status: 'manual_review', screenshotPath, errorMessage: reason })
        .where(eq(applications.id, applicationId));
      await db.insert(applicationLogs).values({
        applicationId, level: 'warn', message: reason,
      });
      return { status: 'manual_review', method: 'auto', logs, screenshotPath };
    }

    const formType = await detectFormType(page);
    log(`Detected form type: ${formType}`);

    if (formType === 'unknown' || formType === 'complex') {
      await db
        .update(applications)
        .set({ status: 'manual_review', screenshotPath, errorMessage: 'Complex form detected — needs manual review' })
        .where(eq(applications.id, applicationId));
      await db.insert(applicationLogs).values({
        applicationId, level: 'warn',
        message: 'Complex or unsupported form detected. This application needs to be completed manually.',
      });
      return { status: 'manual_review', method: 'auto', logs, screenshotPath };
    }

    if (requireConfirmation) {
      await db
        .update(applications)
        .set({ status: 'manual_review', screenshotPath, errorMessage: 'Awaiting manual confirmation before submit' })
        .where(eq(applications.id, applicationId));
      await db.insert(applicationLogs).values({
        applicationId, level: 'info',
        message: 'Form ready but "Require Confirmation" is ON. Disable it in Settings to let the bot submit automatically.',
      });
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
    // Cap wait at 10 s — some pages never reach networkidle due to polling scripts
    await Promise.race([
      page.waitForLoadState('networkidle'),
      new Promise(r => setTimeout(r, 10000)),
    ]);

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

    // Classify the failure and compute retry cooldown
    const failureType = classifyFailure(error);
    const attemptCount = (await db.select({ c: applications.attemptCount }).from(applications).where(eq(applications.id, applicationId)).limit(1))[0]?.c ?? 0;
    const cooldownUntil = computeCooldownUntil(failureType, attemptCount);

    await db
      .update(applications)
      .set({
        status: 'failed',
        errorMessage: error,
        lastFailureType: failureType,
        cooldownUntil,
        lastAttemptAt: new Date(),
      })
      .where(eq(applications.id, applicationId));

    await db.insert(applicationLogs).values({
      applicationId,
      level: 'error',
      message: `[${failureType}] ${error}`,
      metadata: { failureType, cooldownUntil },
    });

    telegramService.notifyApplicationStatus(job, 'failed').catch(() => {});
    return { status: 'failed', method: 'auto', error, logs, screenshotPath };
  } finally {
    await page.close().catch((e) => logger.error({ err: e }, 'Failed to close page'));
  }
}
