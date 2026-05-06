/**
 * LinkedIn Authentication
 *
 * Logs in once with your credentials and persists the Playwright session to disk.
 * Subsequent scrapes reuse the saved session — no repeated logins (which is one
 * of the fastest ways to trigger a LinkedIn security challenge).
 *
 * Credentials MUST be set in .env.local — never stored in the database.
 *   LINKEDIN_EMAIL=your@email.com
 *   LINKEDIN_PASSWORD=yourpassword
 */
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { SessionManager } from './session-manager';
import { logger } from '@/lib/utils/logger';

export const LINKEDIN_DOMAIN = 'linkedin.com';

let stealthReady = false;
function ensureStealth() {
  if (!stealthReady) { chromium.use(StealthPlugin()); stealthReady = true; }
}

export interface LinkedInSessionResult {
  ok: boolean;
  /** 'valid'=existing session reused, 'fresh'=just logged in, 'no_creds'=env not set, 'failed'=error */
  status: 'valid' | 'fresh' | 'no_creds' | 'failed';
  error?: string;
}

/**
 * Ensures a valid LinkedIn session exists on disk.
 * Call this before any authenticated scraping — it is safe to call repeatedly;
 * it only does network work when the session is missing or expired.
 */
export async function ensureLinkedInSession(): Promise<LinkedInSessionResult> {
  const email    = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!email || !password) {
    return { ok: false, status: 'no_creds', error: 'Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in .env.local' };
  }

  // ── Re-use existing session if it is still valid ──────────────────────────
  const savedPath = await SessionManager.getStorageStatePath(LINKEDIN_DOMAIN);
  if (savedPath) {
    const valid = await checkSessionValidity(savedPath);
    if (valid) {
      logger.info('[linkedin-auth] Reusing existing valid session');
      return { ok: true, status: 'valid' };
    }
    logger.warn('[linkedin-auth] Session expired — clearing and re-logging in');
    await SessionManager.clearSession(LINKEDIN_DOMAIN);
  }

  // ── Fresh login ───────────────────────────────────────────────────────────
  return doLogin(email, password);
}

/** Returns true if the saved session can reach the LinkedIn feed without being redirected to login. */
async function checkSessionValidity(sessionPath: string): Promise<boolean> {
  ensureStealth();
  const fp = await SessionManager.getFingerprint(LINKEDIN_DOMAIN);
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const ctx  = await browser.newContext({ userAgent: fp.userAgent, viewport: fp.viewport, storageState: sessionPath });
    const page = await ctx.newPage();
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const url = page.url();
    return !url.includes('/login') && !url.includes('/authwall') && !url.includes('/checkpoint');
  } catch {
    return false;
  } finally {
    await browser.close();
  }
}

/**
 * Performs the login flow.
 *
 * Uses a VISIBLE browser window (headless: false) so that if LinkedIn shows an
 * OTP / email verification / 2-FA challenge you can complete it manually right
 * in the popup window. Once the feed loads, the session is saved automatically
 * and the window closes. All future scrapes use the saved session headlessly.
 *
 * Waits up to 3 minutes for you to complete any verification step.
 */
async function doLogin(email: string, password: string): Promise<LinkedInSessionResult> {
  ensureStealth();
  const fp = await SessionManager.getFingerprint(LINKEDIN_DOMAIN);

  const browser = await chromium.launch({
    headless: false, // visible so user can complete OTP / captcha if needed
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  try {
    const ctx = await browser.newContext({
      userAgent:  fp.userAgent,
      viewport:   fp.viewport,
      locale:     fp.locale,
      timezoneId: fp.timezoneId,
    });
    const page = await ctx.newPage();

    // ── Visit homepage first (natural cookie warm-up) ──────────────────────
    await page.goto('https://www.linkedin.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await sleep(1500 + rand(1000));

    // ── Go to login page ───────────────────────────────────────────────────
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await sleep(1000 + rand(800));

    // ── Type credentials with human-like per-character delays ─────────────
    // Try both known LinkedIn field selectors
    const emailField = page.locator('#username, #session_key').first();
    await emailField.click({ timeout: 10_000 });
    await sleep(300 + rand(200));
    for (const ch of email) {
      await page.keyboard.type(ch, { delay: 60 + rand(80) });
    }

    await sleep(500 + rand(500));
    const pwField = page.locator('#password, #session_password').first();
    await pwField.click({ timeout: 10_000 });
    await sleep(200 + rand(200));
    for (const ch of password) {
      await page.keyboard.type(ch, { delay: 60 + rand(80) });
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    await sleep(800 + rand(600));
    await page.click('[data-litms-control-urn="login-submit"], [type="submit"]');
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    await sleep(2000 + rand(1000));

    const urlAfterLogin = page.url();

    // ── If LinkedIn shows a wrong-password error, fail fast ────────────────
    if (urlAfterLogin.includes('/login') && await page.locator('[role="alert"], .error-for-username, .error-for-password').count() > 0) {
      await browser.close();
      return { ok: false, status: 'failed', error: 'Wrong email or password — check LINKEDIN_EMAIL and LINKEDIN_PASSWORD in .env.local' };
    }

    // ── OTP / checkpoint / 2FA — wait up to 3 min for manual completion ───
    const needsVerification =
      urlAfterLogin.includes('/checkpoint') ||
      urlAfterLogin.includes('/challenge')  ||
      urlAfterLogin.includes('/two-step')   ||
      urlAfterLogin.includes('/authwall');

    if (needsVerification) {
      logger.info('[linkedin-auth] Verification required — waiting up to 3 min for user to complete it in the browser window');

      try {
        // Wait for navigation away from the checkpoint to the feed / home
        await page.waitForURL(
          (u) => u.href.includes('/feed') || u.href.includes('/in/') || u.href === 'https://www.linkedin.com/',
          { timeout: 180_000 } // 3 minutes
        );
      } catch {
        await browser.close();
        return {
          ok: false, status: 'failed',
          error: 'Verification timed out (3 min). Complete the OTP in the browser window faster, then click Connect again.',
        };
      }
    }

    // ── Final URL check ────────────────────────────────────────────────────
    const finalUrl = page.url();
    if (finalUrl.includes('/login') || finalUrl.includes('/authwall')) {
      await browser.close();
      return { ok: false, status: 'failed', error: 'Login failed — could not reach LinkedIn feed' };
    }

    // ── Save session and close ─────────────────────────────────────────────
    await SessionManager.saveSession(ctx, LINKEDIN_DOMAIN);
    logger.info('[linkedin-auth] Login successful, session saved');
    return { ok: true, status: 'fresh' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, '[linkedin-auth] Login threw an error');
    return { ok: false, status: 'failed', error: msg };
  } finally {
    await browser.close();
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const rand = (n: number) => Math.random() * n;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
