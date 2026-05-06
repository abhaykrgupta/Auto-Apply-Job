import { type Page } from 'playwright';
import { logger } from '@/lib/utils/logger';

/**
 * Session Warmer
 *
 * Simulates realistic human browsing behavior on a page BEFORE automation
 * begins. Establishes behavioral legitimacy with bot-detection systems
 * (Cloudflare, DataDome, PerimeterX) that profile user behavior over time.
 *
 * Design rules:
 *  - Bounded randomness: timing ranges are human-plausible, not robotic
 *  - No extreme randomization: stable sessions look more human than chaotic ones
 *  - Does NOT navigate away from the current domain
 *  - Fails silently — warming failure should never block automation
 */

// ── Timing utilities ──────────────────────────────────────────────────────────

/** Returns a random number in [min, max] */
function rand(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

/** Pauses for a human-plausible duration */
async function humanPause(minMs = 800, maxMs = 2500): Promise<void> {
  await new Promise((r) => setTimeout(r, rand(minMs, maxMs)));
}

// ── Interaction primitives ────────────────────────────────────────────────────

/**
 * Scrolls the page gradually — simulates reading behavior.
 * Uses variable scroll distances and inter-step pauses.
 */
async function scrollNaturally(page: Page, totalScrollPx: number): Promise<void> {
  const steps = rand(4, 8);
  const perStep = Math.floor(totalScrollPx / steps);

  for (let i = 0; i < steps; i++) {
    const scroll = perStep + rand(-80, 80); // slight variance per step
    await page.mouse.wheel(0, scroll);
    await humanPause(300, 900);
  }
}

/**
 * Moves mouse to a random position on the visible viewport.
 * Simulates natural cursor drift between interactions.
 */
async function driftMouse(page: Page): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  // Avoid extreme edges (corners look robotic)
  const x = rand(120, viewport.width - 120);
  const y = rand(80, viewport.height - 80);
  await page.mouse.move(x, y, { steps: rand(8, 20) });
}

/**
 * Hover over a visible element for a realistic dwell time.
 * Fails silently if the selector doesn't exist.
 */
async function hoverElement(page: Page, selector: string): Promise<void> {
  try {
    const el = page.locator(selector).first();
    const visible = await el.isVisible({ timeout: 1500 });
    if (!visible) return;
    await el.hover({ timeout: 2000 });
    await humanPause(400, 1200);
  } catch {
    // Element not found or not interactive — skip
  }
}

/**
 * Briefly visits a same-domain link then navigates back.
 * Simulates the user exploring the site before settling on the apply form.
 */
async function brieflyVisitLink(page: Page, selector: string): Promise<void> {
  try {
    const currentUrl = page.url();
    const link = page.locator(selector).first();
    const visible = await link.isVisible({ timeout: 1500 });
    if (!visible) return;

    const href = await link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript')) return;

    // Only follow same-origin links
    const target = new URL(href, currentUrl);
    if (target.origin !== new URL(currentUrl).origin) return;

    await link.click({ timeout: 3000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    await humanPause(2000, 5000); // "read" the target page

    // Scroll a bit on the visited page
    await scrollNaturally(page, rand(200, 600));
    await humanPause(1000, 2500);

    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
    await humanPause(800, 2000);
  } catch {
    // Navigation error — ignore and continue
  }
}

// ── High-level warm sequence ──────────────────────────────────────────────────

/**
 * Main session warming entry point.
 *
 * Call this after navigating to the company career page but BEFORE navigating
 * to the specific job apply URL.
 *
 * @param page    An already-navigated Playwright page
 * @param domain  The domain being warmed (used for logging only)
 * @param level   'light' ≈ 10s | 'standard' ≈ 25s | 'deep' ≈ 50s
 */
export async function warmSession(
  page: Page,
  domain: string,
  level: 'light' | 'standard' | 'deep' = 'standard'
): Promise<void> {
  logger.info({ domain, level }, '[session-warmer] Starting session warming');

  try {
    // Phase 1: Initial page presence — let the page settle, drift mouse
    await humanPause(1200, 2500);
    await driftMouse(page);
    await humanPause(500, 1200);

    // Phase 2: Scroll through content (simulate reading job listings)
    const scrollAmount = level === 'light' ? 400 : level === 'standard' ? 800 : 1400;
    await scrollNaturally(page, scrollAmount);
    await humanPause(600, 1500);

    // Phase 3: Hover over navigation links
    const navSelectors = [
      'nav a', 'header a', '[role="navigation"] a',
      'a[href*="about"]', 'a[href*="team"]', 'a[href*="culture"]',
    ];
    for (const sel of navSelectors.slice(0, rand(1, 3))) {
      await hoverElement(page, sel);
    }

    if (level === 'light') {
      logger.info({ domain }, '[session-warmer] Light warming complete');
      return;
    }

    // Phase 4: Hover over a few job listing items (simulate browsing)
    const jobSelectors = [
      '.job-item', '.opening', 'li.job', '[class*="job-card"]', '[class*="position"]', 'article',
    ];
    for (const sel of jobSelectors) {
      await hoverElement(page, sel);
      if (Math.random() > 0.6) break; // randomly stop after 1-3 hovers
    }

    await humanPause(800, 2000);
    await driftMouse(page);

    if (level === 'standard') {
      // Phase 5 (standard): One brief link visit
      const linkSelectors = [
        'a[href*="about"]', 'a[href*="team"]', 'a[href*="culture"]', 'a[href*="blog"]',
      ];
      const sel = linkSelectors[rand(0, linkSelectors.length - 1)];
      await brieflyVisitLink(page, sel);
      await humanPause(1000, 2000);
      logger.info({ domain }, '[session-warmer] Standard warming complete');
      return;
    }

    // Phase 5 (deep): Scroll back up, then revisit
    await scrollNaturally(page, -scrollAmount * 0.6);
    await humanPause(1500, 3000);
    await driftMouse(page);

    // Two brief link visits
    for (const sel of ['a[href*="about"]', 'a[href*="culture"]']) {
      await brieflyVisitLink(page, sel);
      await humanPause(1200, 2500);
    }

    // Final scroll through listings
    await scrollNaturally(page, rand(300, 700));
    await humanPause(1000, 2000);

    logger.info({ domain }, '[session-warmer] Deep warming complete');
  } catch (err) {
    // Warming is best-effort — never block the main automation
    logger.warn({ err, domain }, '[session-warmer] Warming error — continuing anyway');
  }
}
