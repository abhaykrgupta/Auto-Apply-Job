import { getBrowser } from './playwright-client';
import { detectFormType } from './form-detector';
import { detectCaptcha } from './captcha-detector';
import { classifyFailure, computeCooldownUntil } from './retry-classifier';
import { preflightScreen, buildResumeSummary } from './preflight-screener';
import { warmupPage, humanFill, humanClick, humanScroll, humanSubmit } from './human-mimicry';
import { tryDirectApply } from './direct-apply';
import { db } from '@/lib/db';
import { applications, applicationLogs, settings, preflightLog } from '@/lib/db/schema';
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

    // ── Phase 1: Pre-Flight Screener ─────────────────────────────────────────
    // Run a fast, cheap gpt-4o-mini screen BEFORE we launch a browser.
    // Jobs scoring below threshold are skipped — saves browser time + LLM tokens.
    if (job.description) {
      const resumeSummary = buildResumeSummary(resume.parsedData);
      const preflight = await preflightScreen(job.title, job.description, resumeSummary);

      // Log preflight result
      await db.insert(preflightLog).values({
        jobId: job.id,
        resumeId: resume.id,
        score: preflight.score,
        passed: preflight.pass,
        reason: preflight.reason,
        tokensUsed: preflight.tokensUsed,
      }).catch((err) => logger.warn({ err }, '[ApplyEngine] Failed to write preflight log'));

      if (!preflight.pass) {
        const msg = `[Preflight SKIP] Score ${preflight.score}/100: ${preflight.reason}`;
        log(msg);
        await db.update(applications)
          .set({ status: 'manual_review', errorMessage: msg })
          .where(eq(applications.id, applicationId));
        await db.insert(applicationLogs).values({
          applicationId, level: 'warn',
          message: `Skipped by pre-flight screener (score: ${preflight.score}/100). ${preflight.reason}`,
        });
        return { status: 'manual_review', method: 'auto', logs };
      }
      log(`[Preflight PASS] Score ${preflight.score}/100 — proceeding with automation`);
    }

    // Validate URL before navigating — prevents file://, javascript:, data: attacks
    // Done before direct-apply attempt too so we never hit a bad URL either way.
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(job.applyUrl);
    } catch {
      throw new Error(`Invalid apply URL: ${job.applyUrl}`);
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(`Blocked unsafe URL protocol: ${parsedUrl.protocol}`);
    }

    // ── Phase 1.5: Direct API Apply (Lever / Ashby) ───────────────────────────
    // Try submitting via ATS public API first — no browser, no CAPTCHA.
    // Only falls through to Playwright if the ATS is unsupported or the API call fails.
    if (resume.parsedData) {
      const parsed = resume.parsedData as {
        name?: string; email?: string; phone?: string;
        experience?: Array<{ company: string }>;
        links?: { linkedin?: string; github?: string };
      };
      const nameParts = (parsed.name ?? '').split(' ');

      const directResult = await tryDirectApply(job.applyUrl, {
        firstName:      nameParts[0] ?? '',
        lastName:       nameParts.slice(1).join(' ') ?? '',
        email:          parsed.email ?? '',
        phone:          parsed.phone ?? '',
        resumeFilePath: resume.filePath,
        linkedinUrl:    parsed.links?.linkedin,
        githubUrl:      parsed.links?.github,
        currentCompany: parsed.experience?.[0]?.company,
      });

      if (directResult.success) {
        log(`[DirectApply] ${directResult.method}: application submitted (id: ${directResult.applicationId ?? 'n/a'})`);
        await db.update(applications)
          .set({ status: 'applied', appliedAt: new Date(), attemptCount: 1, lastAttemptAt: new Date(), method: directResult.method })
          .where(eq(applications.id, applicationId));
        await db.insert(applicationLogs).values({
          applicationId, level: 'info',
          message: `Applied via ${directResult.method} — no browser needed`,
        });
        telegramService.notifyApplicationStatus(job, 'applied').catch(() => {});
        return { status: 'applied', method: directResult.method, logs };
      }

      if (directResult.method !== 'unsupported') {
        // API was tried but failed — log and continue to Playwright fallback
        log(`[DirectApply] ${directResult.method} failed (${directResult.error}) — falling back to Playwright`);
        await db.insert(applicationLogs).values({
          applicationId, level: 'warn',
          message: `Direct API apply failed: ${directResult.error}. Trying browser automation.`,
        });
      }
    }

    log(`Navigating to ${parsedUrl.toString()}`);
    await page.goto(parsedUrl.toString(), { waitUntil: 'networkidle', timeout: 30000 });

    // ── Phase 2: Human warmup — simulate reading the page before interacting ──
    await warmupPage(page);

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

    // Form filling for standard forms
    const parsed = resume.parsedData as {
      name?: string; email?: string; phone?: string;
      experience?: Array<{ title: string; company: string }>;
      skills?: string[];
    } | null;

    if (parsed) {
      const nameParts = (parsed.name ?? '').split(' ');

      // ── Phase 2: Human-mimicry typing ─────────────────────────────────────
      // Scroll before filling — simulates a human reading the form first
      await humanScroll(page);

      await humanFill(page, 'input[name*="first"], input[id*="first"], input[placeholder*="First"]', nameParts[0] ?? '');
      await humanFill(page, 'input[name*="last"], input[id*="last"], input[placeholder*="Last"]', nameParts.slice(1).join(' ') ?? '');
      await humanFill(page, 'input[type="email"], input[name*="email"]', parsed.email ?? '');
      await humanFill(page, 'input[type="tel"], input[name*="phone"]', parsed.phone ?? '');

      // Upload resume file
      const fileInput = await page.$('input[type="file"]');
      if (fileInput && resume.filePath) {
        await fileInput.setInputFiles(resume.filePath).catch(() => {});
        log('Resume file uploaded');
      }
    }

    screenshotPath = path.join(screenshotDir, `${applicationId}-filled.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // ── Phase 2: Human-mimicry submit — pause before clicking Submit ─────────
    await humanSubmit(page, 'button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")');
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
