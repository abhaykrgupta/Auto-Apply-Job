import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { logger } from '@/lib/utils/logger';
import { SessionManager } from './session-manager';

/**
 * Shared browser instance with optional persistent sessions.
 *
 * Design:
 *  - One long-lived Browser process (reused across requests in the same Node process)
 *  - Per-domain BrowserContext with persisted storageState (cookies, localStorage)
 *  - Context is closed + state saved after each use
 *
 * Anti-bot hardening:
 *  - Stable fingerprint per domain (viewport, UA, timezone) — do NOT randomize per session
 *  - Automation flags suppressed via launch args + initScript
 *  - Session warming supported via optional pre-navigation
 */

let browserInstance: Browser | null = null;

async function getBrowserInstance(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--no-default-browser-check',
        '--password-store=basic',
        '--use-mock-keychain',
      ],
    });
    logger.info('Browser instance launched');
  }
  return browserInstance;
}

/**
 * Returns a new page with a stable, domain-specific browser context.
 * The context loads persisted session state if available.
 * Call saveAndCloseContext() after use to persist the session.
 */
export async function getPageWithSession(domain: string): Promise<{ page: Page; context: BrowserContext }> {
  const browser = await getBrowserInstance();
  const fingerprint = await SessionManager.getFingerprint(domain);
  const storageStatePath = await SessionManager.getStorageStatePath(domain);

  const context = await browser.newContext({
    userAgent: fingerprint.userAgent,
    viewport: fingerprint.viewport,
    locale: fingerprint.locale,
    timezoneId: fingerprint.timezoneId,
    colorScheme: fingerprint.colorScheme,
    // Load persisted session if available
    ...(storageStatePath ? { storageState: storageStatePath } : {}),
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Macintosh"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  });

  const page = await context.newPage();

  // Suppress automation indicators
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    (window as unknown as Record<string, unknown>).chrome = { runtime: {} };
  });

  if (storageStatePath) {
    logger.debug({ domain }, 'Loaded persisted browser session');
  }

  return { page, context };
}

/** Saves session state and closes the context */
export async function saveAndCloseContext(context: BrowserContext, domain: string): Promise<void> {
  try {
    await SessionManager.saveSession(context, domain);
  } catch {
    // Non-critical
  }
  await context.close().catch((err) => logger.debug({ err }, 'Context close error'));
}

/**
 * Legacy single-page browser getter (unchanged behaviour).
 * New code should prefer getPageWithSession() for session persistence.
 */
export async function getBrowser(): Promise<Browser> {
  return getBrowserInstance();
}

export async function closeBrowser(): Promise<void> {
  await browserInstance?.close();
  browserInstance = null;
}
