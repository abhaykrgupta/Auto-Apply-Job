import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, BrowserContext, Page } from 'playwright';
import { logger } from '@/lib/utils/logger';
import { GreenhouseScraper } from './greenhouse';
import { LeverScraper } from './lever';
import { type ScrapedJob, type JobFilters } from './base-scraper';
import { rateLimitedOpenAI } from '@/lib/openai/rate-limiter';
import { openai } from '@/lib/openai/client';
import { scraperMemoryService } from './scraper-memory';
import { fingerprintDOM, extractDomain } from './dom-fingerprint';
import { trackUsageFromResponse } from '@/lib/openai/usage-tracker';

chromium.use(StealthPlugin());

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
];

export class UniversalCareerScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async scrape(companyName: string, websiteUrl: string, filters: JobFilters = {}): Promise<ScrapedJob[]> {
    try {
      await this.setup();

      const domain = new URL(websiteUrl).hostname.replace('www.', '');
      logger.info({ companyName, domain }, 'Starting universal scrape');

      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 2000));

      const careerUrls = await this.findCareerPages(websiteUrl);
      
      for (const url of careerUrls) {
        const jobs = await this.extractJobsFromUrl(companyName, url, filters);
        if (jobs && jobs.length > 0) {
          logger.info({ companyName, url, count: jobs.length }, 'Successfully extracted jobs');
          return jobs;
        }
      }

      logger.warn({ companyName }, 'No jobs found on any career page');
      return [];
    } catch (err) {
      logger.error({ err, companyName }, 'Universal scraper failed');
      return [];
    } finally {
      await this.cleanup();
    }
  }

  private async setup() {
    this.browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-running-insecure-content',
        '--no-first-run',
        '--no-default-browser-check',
        '--password-store=basic',
        '--use-mock-keychain',
      ],
    });

    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    this.context = await this.browser.newContext({
      userAgent: ua,
      viewport: {
        width: 1280 + Math.floor(Math.random() * 200),
        height: 800 + Math.floor(Math.random() * 100),
      },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
  }

  private async newPage(): Promise<Page> {
    if (!this.context) throw new Error('Context not initialized');
    const page = await this.context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      (window as unknown as Record<string, unknown>).chrome = { runtime: {} };
    });
    return page;
  }

  private async isBlocked(page: Page): Promise<boolean> {
    const title = await page.title().catch(() => '');
    return (
      title.includes('Just a moment') ||
      title.includes('Attention Required') ||
      title.includes('Access denied') ||
      title.includes('403 Forbidden')
    );
  }

  private async cleanup() {
    await this.context?.close();
    await this.browser?.close();
    this.context = null;
    this.browser = null;
  }

  private async findCareerPages(baseUrl: string): Promise<string[]> {
    const urlsToTry: string[] = [];

    const paths = ['/careers', '/jobs', '/work-with-us', '/join-us', '/join', '/hiring', '/openings'];
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    paths.forEach((p) => urlsToTry.push(`${cleanBase}${p}`));

    try {
      const page = await this.newPage();
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

      if (await this.isBlocked(page)) {
        await new Promise((r) => setTimeout(r, 5000));
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
      }

      const links = await page.evaluate(() => {
        const keywords = ['career', 'job', 'hiring', 'work', 'join', 'opening'];
        return Array.from(document.querySelectorAll('a'))
          .filter((a) =>
            keywords.some(
              (k) =>
                a.textContent?.toLowerCase().includes(k) ||
                a.href?.toLowerCase().includes(k)
            )
          )
          .map((a) => a.href)
          .filter((h) => h.startsWith('http'));
      });

      urlsToTry.push(...links);
      await page.close();
    } catch (err) {
      logger.debug({ err, baseUrl }, 'Failed to parse homepage links');
    }

    return [...new Set(urlsToTry)];
  }

  private async extractJobsFromUrl(
    companyName: string,
    url: string,
    _filters: JobFilters
  ): Promise<ScrapedJob[]> {
    try {
      const lowerUrl = url.toLowerCase();

      // ── Tier 1: Known ATS — dedicated scrapers (fastest, most reliable) ──
      if (lowerUrl.includes('greenhouse.io') || lowerUrl.includes('boards.greenhouse.io')) {
        const scraper = new GreenhouseScraper();
        return await scraper.scrapePage(url);
      }
      if (lowerUrl.includes('lever.co') || lowerUrl.includes('jobs.lever.co')) {
        const scraper = new LeverScraper();
        return await scraper.scrapePage(url);
      }

      // ── Tier 2–4: Memory-assisted extraction ─────────────────────────────
      return await this.extractWithMemory(companyName, url);
    } catch (err) {
      logger.debug({ err, url }, 'Failed to extract jobs from URL');
      return [];
    }
  }

  /**
   * Multi-tier extraction with learning memory:
   *  Tier 2 — common CSS patterns (no GPT, no memory lookup needed)
   *  Tier 3 — stored domain-specific selectors from memory
   *  Tier 4 — GPT extraction (expensive, last resort) + learn selectors for next time
   */
  private async extractWithMemory(companyName: string, url: string): Promise<ScrapedJob[]> {
    const domain = extractDomain(url);
    const page = await this.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 12000 });

      if (await this.isBlocked(page)) {
        logger.warn({ url }, 'Bot protection detected — skipping page');
        await page.close();
        return [];
      }

      // Get DOM fingerprint for memory lookup
      const html = await page.content();
      const domHash = fingerprintDOM(html);

      // ── Tier 3: Check scraper memory for domain-specific selectors ────────
      const memoryRecord = await scraperMemoryService.lookup(domain, domHash);
      if (memoryRecord) {
        const memoryJobs = await scraperMemoryService.tryExtractWithSelectors(page, memoryRecord, companyName, url);
        if (memoryJobs && memoryJobs.length > 0) {
          await scraperMemoryService.record(domain, domHash, memoryRecord.selectors, 'selector', memoryRecord.atsType ?? undefined);
          await page.close();
          return memoryJobs.map((j) => ({
            company: companyName,
            title: j.title,
            location: j.location,
            description: j.description,
            applyUrl: j.applyUrl,
            source: 'custom' as const,
            postedAt: new Date(),
          }));
        }
        // Memory selectors failed — record failure and fall through to GPT
        await scraperMemoryService.recordFailure(domain, domHash);
      }

      // ── Tier 2: Probe common patterns (no GPT needed) ─────────────────────
      const patternResult = await scraperMemoryService.probeCommonPatterns(page, url);
      if (patternResult && patternResult.jobs.length > 0) {
        // Learn these selectors for future visits
        scraperMemoryService.record(domain, domHash, patternResult.selectors, 'selector').catch(() => {});
        await page.close();
        return patternResult.jobs.map((j) => ({
          company: companyName,
          title: j.title,
          location: j.location,
          description: j.description,
          applyUrl: j.applyUrl,
          source: 'custom' as const,
          postedAt: new Date(),
        }));
      }

      // ── Tier 4: GPT extraction (fallback only) ────────────────────────────
      logger.info({ domain, url }, 'No selector match — using GPT extraction');
      const jobs = await this.extractWithAI(companyName, url, page);

      if (jobs.length > 0) {
        // Store a generic AI-extraction memory entry so we know GPT was needed here
        scraperMemoryService.record(
          domain,
          domHash,
          { jobContainer: 'body', title: 'h2,h3', location: '.location', applyLink: 'a' },
          'ai'
        ).catch(() => {});
      }

      return jobs;
    } catch (err) {
      await page.close().catch(() => {});
      throw err;
    }
  }

  /**
   * GPT-powered extraction. Accepts an already-loaded page to avoid a
   * redundant navigation when called from extractWithMemory.
   */
  private async extractWithAI(companyName: string, url: string, existingPage?: Page): Promise<ScrapedJob[]> {
    const page = existingPage ?? await this.newPage();
    const needsNav = !existingPage;

    try {
      if (needsNav) {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });

        if (await this.isBlocked(page)) {
          logger.warn({ url }, 'Bot protection detected — skipping page');
          await page.close();
          return [];
        }
      }

      await page.evaluate(() => {
        document
          .querySelectorAll('script, style, nav, footer, header, svg, img, iframe')
          .forEach((el) => el.remove());
      });

      const textContent = await page.evaluate(() => document.body.innerText || '');
      if (needsNav) await page.close();

      if (!textContent || textContent.length < 50) return [];

      const startTime = Date.now();
      const response = await rateLimitedOpenAI(() =>
        openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert job extractor. Extract all job listings from this careers page text. For each job return: title, location, department, applyUrl (absolute URL), and a 1-sentence description. Return as JSON: { "jobs": [...] }. If no jobs found return { "jobs": [] }.',
            },
            {
              role: 'user',
              content: `Company: ${companyName}\nPage URL: ${url}\n\nText:\n${textContent.substring(0, 25000)}`,
            },
          ],
          response_format: { type: 'json_object' },
        })
      );

      trackUsageFromResponse('scrape_extract', 'gpt-4o', response, startTime);

      const content = response.choices[0]?.message?.content || '{"jobs":[]}';
      let parsed: { jobs?: unknown[] };
      try {
        parsed = JSON.parse(content);
      } catch {
        return [];
      }

      const jobsArr = Array.isArray(parsed) ? parsed : (parsed.jobs ?? []);

      return (jobsArr as Record<string, string>[])
        .map((j) => ({
          company: companyName,
          title: j.title || 'Unknown Title',
          location: j.location || 'Remote',
          description: j.description || '',
          applyUrl: j.applyUrl?.startsWith('http')
            ? j.applyUrl
            : new URL(j.applyUrl || '', url).toString(),
          source: 'custom' as const,
          postedAt: new Date(),
        }))
        .filter((j) => j.title && j.applyUrl);
    } catch (err) {
      if (needsNav) await page.close().catch(() => {});
      throw err;
    }
  }
}
