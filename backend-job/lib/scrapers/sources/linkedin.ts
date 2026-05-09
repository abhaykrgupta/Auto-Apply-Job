/**
 * LinkedIn Scraper
 *
 * Strategy (in order):
 *   1. Guest API  — fetch job listings without a browser (fast, no bot risk)
 *   2. Auth pages — if LINKEDIN_EMAIL/PASSWORD are set, open each job page with
 *                   a saved Playwright session to extract the full description
 *                   and requirements that LinkedIn hides behind login.
 *
 * Account-safety rules built in:
 *   • Login once → session reused (no repeated logins)
 *   • Max LINKEDIN_MAX_JOBS jobs per scrape (default 20) — keeps traffic volume low
 *   • 2–5 s random delay between every page visit — mimics human reading speed
 *   • Serial page visits only — no parallel tabs (too obvious to detection)
 *   • Stops immediately if a CAPTCHA / login wall is detected mid-scrape
 *   • Stable browser fingerprint (reused across runs, never randomised)
 */
import { type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

const MAX_JOBS   = parseInt(process.env.LINKEDIN_MAX_JOBS ?? '20');
const GUEST_URL  = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

export class LinkedInScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    // ── Step 1: get listings from the public guest API (no browser needed) ──
    const listings = await this.fetchListings(filters);
    if (!listings.length) return [];

    // ── Step 2: if credentials exist, enrich with full descriptions ─────────
    const hasAuth = !!(process.env.LINKEDIN_EMAIL && process.env.LINKEDIN_PASSWORD);
    if (!hasAuth) {
      logger.info('[linkedin] No credentials — returning card-level data only (add LINKEDIN_EMAIL + LINKEDIN_PASSWORD to .env.local for full descriptions)');
      return listings;
    }

    return this.enrichWithDetails(listings);
  }

  // ─── Guest API ────────────────────────────────────────────────────────────

  private async fetchListings(filters: JobFilters): Promise<ScrapedJob[]> {
    try {
      const params = new URLSearchParams();
      if (filters.role)              params.set('keywords', filters.role);
      if (filters.location)          params.set('location', filters.location);
      if (filters.remote === 'remote') params.set('f_WT', '2');
      params.set('f_TPR', 'r604800'); // last 7 days
      params.set('start', '0');
      params.set('count', String(Math.min(filters.limit ?? MAX_JOBS, 25)));

      const url = `${GUEST_URL}?${params.toString()}`;
      logger.info(`[linkedin] Guest API → ${url}`);

      const res = await fetch(url, {
        headers: {
          'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer:           'https://www.linkedin.com/jobs/search/',
        },
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        logger.warn(`[linkedin] Guest API returned ${res.status}`);
        return [];
      }

      const html = await res.text();
      const jobs = this.parseCards(html);
      logger.info(`[linkedin] Guest API found ${jobs.length} listings`);
      return jobs;
    } catch (err) {
      logger.error({ err }, '[linkedin] Guest API failed');
      return [];
    }
  }

  // ─── Authenticated detail enrichment ─────────────────────────────────────

  private async enrichWithDetails(listings: ScrapedJob[]): Promise<ScrapedJob[]> {
    const { ensureLinkedInSession, LINKEDIN_DOMAIN } = await import('@/lib/automation/linkedin-auth');
    const { SessionManager } = await import('@/lib/automation/session-manager');
    const { chromium } = await import('playwright-extra');
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;

    // Ensure we have a valid session (login if needed)
    const auth = await ensureLinkedInSession();
    if (!auth.ok) {
      logger.warn(`[linkedin] Auth failed (${auth.error}) — returning card-level data`);
      return listings;
    }

    chromium.use(StealthPlugin());
    const fp            = await SessionManager.getFingerprint(LINKEDIN_DOMAIN);
    const sessionPath   = await SessionManager.getStorageStatePath(LINKEDIN_DOMAIN);

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
    });

    const ctx = await browser.newContext({
      userAgent:    fp.userAgent,
      viewport:     fp.viewport,
      locale:       fp.locale,
      timezoneId:   fp.timezoneId,
      storageState: sessionPath,
    });

    const enriched: ScrapedJob[] = [];
    const toVisit = listings.slice(0, MAX_JOBS);

    try {
      for (let i = 0; i < toVisit.length; i++) {
        const job = toVisit[i];
        if (!job.applyUrl) { enriched.push(job); continue; }

        const page = await ctx.newPage();
        try {
          await page.goto(job.applyUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 });

          // ── Check for login wall / CAPTCHA ─────────────────────────────
          const url = page.url();
          if (url.includes('/login') || url.includes('/authwall') || url.includes('/checkpoint')) {
            logger.warn('[linkedin] Hit login wall mid-scrape — clearing session and stopping enrichment');
            await SessionManager.clearSession(LINKEDIN_DOMAIN);
            await page.close();
            enriched.push(...toVisit.slice(i)); // push remaining as card-only
            break;
          }

          const captchaSignals = ['captcha', 'are you a robot', 'verify you are human'];
          const bodyText = (await page.textContent('body').catch(() => '') ?? '').toLowerCase();
          if (captchaSignals.some(s => bodyText.includes(s))) {
            logger.warn('[linkedin] CAPTCHA detected — stopping enrichment to protect account');
            await page.close();
            enriched.push(...toVisit.slice(i));
            break;
          }

          // ── Extract full description ────────────────────────────────────
          const details = await page.evaluate(() => {
            const desc = document.querySelector(
              '.jobs-description__content, .job-view-layout .description__text, [class*="description"] .show-more-less-html__markup'
            )?.innerHTML?.trim() ?? '';

            const criteria = Array.from(
              document.querySelectorAll('.job-criteria__item')
            ).map(el => el.textContent?.trim()).join(' | ');

            const salary = document.querySelector(
              '.compensation__salary, [class*="salary"]'
            )?.textContent?.trim() ?? '';

            return { desc, criteria, salary };
          });

          // Strip HTML tags from description
          const plainDesc = details.desc
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/?(li|p|div)[^>]*>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

          enriched.push({
            ...job,
            description:  plainDesc || job.description,
            requirements: details.criteria || job.requirements,
          });

          logger.info(`[linkedin] Enriched ${i + 1}/${toVisit.length}: ${job.title}`);
        } catch (err) {
          logger.warn({ err, url: job.applyUrl }, '[linkedin] Failed to enrich job — using card data');
          enriched.push(job);
        } finally {
          await page.close();
        }

        // ── Human-like delay between pages (2–5 s, random) ─────────────
        if (i < toVisit.length - 1) {
          await sleep(2000 + Math.random() * 3000);
        }
      }

      // Persist updated session cookies
      await SessionManager.saveSession(ctx, LINKEDIN_DOMAIN);
    } finally {
      await browser.close();
    }

    return enriched;
  }

  // ─── HTML card parser (guest API response) ────────────────────────────────

  private parseCards(html: string): ScrapedJob[] {
    const jobs: ScrapedJob[] = [];
    const chunks = html.split(/<li[^>]*>/i).slice(1);

    for (const chunk of chunks) {
      try {
        const applyUrl =
          this.attr(chunk, 'href', 'base-card__full-link') ||
          this.attr(chunk, 'href', 'job-search-card__title-link');
        if (!applyUrl) continue;

        const jobId = applyUrl.match(/\/jobs\/view\/(\d+)/)?.[1] ?? '';

        const title =
          this.text(chunk, 'base-search-card__title') ||
          this.text(chunk, 'job-search-card__title') ||
          this.text(chunk, 'result-card__title');

        const company =
          this.text(chunk, 'base-search-card__subtitle') ||
          this.text(chunk, 'job-search-card__company-name') ||
          this.text(chunk, 'result-card__subtitle');

        const location =
          this.text(chunk, 'job-search-card__location') ||
          this.text(chunk, 'result-card__location');

        const dateTime = chunk.match(/<time[^>]*datetime="([^"]+)"/i)?.[1];

        if (!title) continue;

        jobs.push({
          externalId: jobId || applyUrl,
          source:     'linkedin',
          company:    company || 'Unknown',
          title:      title.trim(),
          location:   location?.trim(),
          description: title.trim(), // overwritten when enriched
          applyUrl:   applyUrl.split('?')[0],
          postedAt:   dateTime ? new Date(dateTime) : new Date(),
        } as ScrapedJob);
      } catch {
        // skip malformed card
      }
    }

    return jobs;
  }

  /** Extract text from first element with given CSS class. */
  private text(html: string, cls: string): string {
    const m = html.match(new RegExp(`class="[^"]*${cls}[^"]*"[^>]*>([\\s\\S]*?)<\\/`, 'i'));
    if (!m) return '';
    return m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#\d+;/g, '').trim();
  }

  /** Extract an href/src attribute from element with given CSS class. */
  private attr(html: string, attr: string, cls: string): string {
    const m = html.match(
      new RegExp(`class="[^"]*${cls}[^"]*"[^>]*${attr}="([^"]+)"|${attr}="([^"]+)"[^>]*class="[^"]*${cls}[^"]*"`, 'i')
    );
    return m ? (m[1] || m[2] || '') : '';
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
