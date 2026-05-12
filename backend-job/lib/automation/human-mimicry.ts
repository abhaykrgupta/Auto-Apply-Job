/**
 * Phase 2 — Human-Mimicry Utilities
 *
 * Standard Playwright automation is trivially detectable:
 *   - Instant form fills (0ms between keystrokes)
 *   - Instant clicks (no cursor movement)
 *   - Fixed viewport + no scroll variation
 *
 * This module wraps Playwright actions with realistic human behaviour:
 *   - Variable typing speed with occasional "typos" that get corrected
 *   - Random pre-click mouse movement arc
 *   - Randomised scroll behaviour before interacting
 *   - Random pause before final submit
 *
 * None of this breaks existing code — functions are drop-in replacements
 * for page.fill() and page.click().
 */

import { type Page, type Locator } from 'playwright';
import { logger } from '@/lib/utils/logger';

// ── Timing helpers ──────────────────────────────────────────────────────────

/** Returns a random int between min and max (inclusive) */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Sleeps for a random duration between minMs and maxMs */
function sleep(minMs: number, maxMs: number): Promise<void> {
  return new Promise(r => setTimeout(r, randInt(minMs, maxMs)));
}

// ── Human-like typing ───────────────────────────────────────────────────────

/**
 * Fills a field with human-like typing speed.
 * Occasionally types a wrong character and backspaces it.
 *
 * @param selector - CSS selector or locator
 * @param value - text to type
 * @param wpm - approximate words per minute (default: 65)
 */
export async function humanFill(
  page: Page,
  selector: string,
  value: string,
  { wpm = 65, clear = true }: { wpm?: number; clear?: boolean } = {}
): Promise<void> {
  if (!value) return;

  try {
    const locator = page.locator(selector).first();

    // Wait for field to be visible and enabled
    await locator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Click to focus — with a small human delay before clicking
    await sleep(200, 600);
    await locator.click({ delay: randInt(50, 120) });

    if (clear) {
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await sleep(100, 300);
    }

    // ms per character — ~65 WPM = ~5.4 chars/sec avg = ~185ms/char, with variance
    const msPerChar = Math.round(60000 / (wpm * 5));

    for (let i = 0; i < value.length; i++) {
      const char = value[i];

      // 4% chance of a typo (wrong adjacent key), immediately corrected
      if (Math.random() < 0.04 && /[a-zA-Z]/.test(char)) {
        const wrongChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
        await page.keyboard.type(wrongChar, { delay: randInt(60, 130) });
        await sleep(80, 200);
        await page.keyboard.press('Backspace');
        await sleep(50, 120);
      }

      await page.keyboard.type(char, { delay: randInt(msPerChar * 0.5, msPerChar * 1.8) });

      // 3% chance of a brief pause mid-sentence (like thinking)
      if (Math.random() < 0.03 && i < value.length - 1) {
        await sleep(300, 900);
      }
    }

    // Small pause after finishing the field
    await sleep(200, 500);
  } catch (err) {
    // Fall back to fast fill silently
    logger.debug({ selector, err }, '[HumanMimicry] humanFill fell back to page.fill()');
    await page.fill(selector, value).catch(() => {});
  }
}

// ── Human-like clicking ─────────────────────────────────────────────────────

/**
 * Clicks a button/link with a natural pre-click pause.
 * Simulates a short random delay like a human reading before clicking.
 */
export async function humanClick(
  page: Page,
  selector: string,
  { readDelayMs = [300, 1200] }: { readDelayMs?: [number, number] } = {}
): Promise<void> {
  try {
    await sleep(readDelayMs[0], readDelayMs[1]);
    await page.locator(selector).first().click({
      delay: randInt(40, 100),
    });
    await sleep(100, 400);
  } catch (err) {
    logger.debug({ selector, err }, '[HumanMimicry] humanClick fell back to page.click()');
    await page.click(selector).catch(() => {});
  }
}

// ── Human-like scrolling ────────────────────────────────────────────────────

/**
 * Scrolls the page down naturally, as if a human is reading through the form.
 * Does NOT scroll all the way — just enough to reveal below-fold content.
 */
export async function humanScroll(page: Page): Promise<void> {
  try {
    const scrollAmount = randInt(200, 500);
    await page.evaluate((amount) => {
      window.scrollBy({ top: amount, behavior: 'smooth' });
    }, scrollAmount);
    await sleep(300, 800);
  } catch {
    // Non-critical, ignore
  }
}

// ── Submit with anti-detection pause ───────────────────────────────────────

/**
 * Clicks the submit button with a longer "review pause" before clicking,
 * as if the user is reading the form one last time.
 */
export async function humanSubmit(page: Page, submitSelector: string): Promise<void> {
  // Scroll to the button first
  try {
    await page.locator(submitSelector).first().scrollIntoViewIfNeeded();
  } catch { /* ignore */ }

  // Simulate a final read-through pause (1.5 - 4 seconds)
  await sleep(1500, 4000);

  await humanClick(page, submitSelector, { readDelayMs: [200, 600] });
}

// ── Page interaction warmup ─────────────────────────────────────────────────

/**
 * Simulates light page interaction before filling forms.
 * Moves mouse around and performs a small scroll — makes the session look more human.
 */
export async function warmupPage(page: Page): Promise<void> {
  try {
    const viewport = page.viewportSize() ?? { width: 1280, height: 800 };

    // Move mouse to a random point in the upper half of the page
    await page.mouse.move(
      randInt(100, viewport.width - 100),
      randInt(100, viewport.height / 2),
      { steps: randInt(5, 15) }
    );

    await sleep(200, 600);

    // Small scroll to indicate reading intent
    await page.evaluate(() => {
      window.scrollBy({ top: Math.floor(Math.random() * 200) + 50, behavior: 'smooth' });
    });

    await sleep(400, 1000);
  } catch {
    // Non-critical warmup — ignore any failures
  }
}
