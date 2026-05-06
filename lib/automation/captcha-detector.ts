import { type Page } from 'playwright';
import { logger } from '@/lib/utils/logger';

export type CaptchaVendor =
  | 'cloudflare'
  | 'datadome'
  | 'arkose'
  | 'hcaptcha'
  | 'recaptcha'
  | 'generic';

export interface CaptchaDetectionResult {
  detected: boolean;
  vendor?: CaptchaVendor;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Detects CAPTCHA / bot-protection challenges on a loaded Playwright page.
 *
 * Strategy — multi-signal approach (title + URL + DOM + body text):
 *  1. Page title keywords (Cloudflare "Just a moment", Imperva "Attention Required")
 *  2. URL patterns (challege domains, token params)
 *  3. DOM elements (iframe srcs, known widget container IDs)
 *  4. Body text keywords as last resort
 *
 * On detection the caller should:
 *  - Mark application as manual_review
 *  - Take a screenshot for the user
 *  - Avoid immediate retry (wait for human to resolve)
 */
export async function detectCaptcha(page: Page): Promise<CaptchaDetectionResult> {
  try {
    const title = await page.title().catch(() => '');
    const currentUrl = page.url();
    const bodyHtml = await page.content().catch(() => '');

    const titleLower = title.toLowerCase();
    const urlLower = currentUrl.toLowerCase();
    const htmlLower = bodyHtml.toLowerCase();

    // ── Cloudflare ──────────────────────────────────────────────────────────
    if (
      titleLower.includes('just a moment') ||
      titleLower.includes('checking your browser') ||
      htmlLower.includes('cf-challenge-running') ||
      htmlLower.includes('cf_chl_opt') ||
      htmlLower.includes('cloudflare') && htmlLower.includes('checking')
    ) {
      return result('cloudflare', 'high', 'Cloudflare JS challenge page detected');
    }

    // ── DataDome ────────────────────────────────────────────────────────────
    if (
      htmlLower.includes('datadome') ||
      htmlLower.includes('dd_cookie') ||
      urlLower.includes('datadome.co')
    ) {
      return result('datadome', 'high', 'DataDome bot protection detected');
    }

    // ── Arkose / FunCaptcha ──────────────────────────────────────────────────
    if (
      htmlLower.includes('arkoselabs.com') ||
      htmlLower.includes('funcaptcha') ||
      htmlLower.includes('arkose')
    ) {
      return result('arkose', 'high', 'Arkose FunCaptcha detected');
    }

    // ── hCaptcha ─────────────────────────────────────────────────────────────
    if (
      htmlLower.includes('hcaptcha.com') ||
      htmlLower.includes('h-captcha') ||
      htmlLower.includes('hcaptcha-response')
    ) {
      return result('hcaptcha', 'high', 'hCaptcha widget detected');
    }

    // ── reCAPTCHA ────────────────────────────────────────────────────────────
    if (
      htmlLower.includes('recaptcha') ||
      htmlLower.includes('g-recaptcha') ||
      urlLower.includes('google.com/recaptcha')
    ) {
      return result('recaptcha', 'high', 'Google reCAPTCHA detected');
    }

    // ── Generic block pages ──────────────────────────────────────────────────
    if (
      titleLower.includes('attention required') ||
      titleLower.includes('access denied') ||
      titleLower.includes('403 forbidden') ||
      titleLower.includes('robot check') ||
      titleLower.includes('are you human') ||
      htmlLower.includes('please verify you are a human') ||
      htmlLower.includes('verify you are not a robot')
    ) {
      return result('generic', 'medium', `Generic bot protection page: "${title}"`);
    }

    return { detected: false, confidence: 'high', reason: 'No CAPTCHA detected' };
  } catch (err) {
    logger.debug({ err }, 'CAPTCHA detection error — assuming no CAPTCHA');
    return { detected: false, confidence: 'low', reason: 'Detection check failed' };
  }
}

function result(vendor: CaptchaVendor, confidence: CaptchaDetectionResult['confidence'], reason: string): CaptchaDetectionResult {
  logger.warn({ vendor, confidence, reason }, 'CAPTCHA detected');
  return { detected: true, vendor, confidence, reason };
}
