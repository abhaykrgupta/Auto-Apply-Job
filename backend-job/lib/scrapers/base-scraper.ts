import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page, BrowserContext } from 'playwright';
import { logger } from '@/lib/utils/logger';

let isStealthInitialized = false;

export interface ScrapedJob {
  externalId?: string;
  company: string;
  title: string;
  location?: string;
  locationType?: string;
  description: string;
  requirements?: string;
  applyUrl: string;
  postedAt?: Date;
  source: 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'linkedin' | 'indeed' | 'custom';
}

export interface JobFilters {
  role?: string;
  location?: string;
  remote?: string;
  limit?: number;
  datePosted?: string; // '1d', '3d', '7d', '30d', 'all'
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
];

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected requestDelay: number;

  constructor() {
    this.requestDelay = parseInt(process.env.SCRAPER_REQUEST_DELAY_MS ?? '2000');
  }

  abstract scrapePage(url: string): Promise<ScrapedJob[]>;
  abstract searchJobs(filters: JobFilters): Promise<ScrapedJob[]>;

  protected async setup() {
    if (!isStealthInitialized) {
      chromium.use(StealthPlugin());
      isStealthInitialized = true;
    }
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

    logger.info('Browser launched with stealth mode');
  }

  protected async newPage(): Promise<Page> {
    if (!this.context) throw new Error('Browser context not initialized — call setup() first');
    const page = await this.context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      (window as unknown as Record<string, unknown>).chrome = { runtime: {} };
    });
    return page;
  }

  protected async isBlocked(page: Page): Promise<boolean> {
    const title = await page.title().catch(() => '');
    return (
      title.includes('Just a moment') ||
      title.includes('Attention Required') ||
      title.includes('Access denied') ||
      title.includes('403 Forbidden')
    );
  }

  protected async cleanup() {
    await this.context?.close();
    await this.browser?.close();
    this.context = null;
    this.browser = null;
    logger.info('Browser closed');
  }

  protected async delay(ms?: number) {
    await new Promise((resolve) => setTimeout(resolve, ms ?? this.requestDelay));
  }

  protected async humanMove(page: Page, selector?: string) {
    const vp = page.viewportSize() ?? { width: 1280, height: 800 };
    await page.mouse.move(
      Math.floor(Math.random() * vp.width),
      Math.floor(Math.random() * vp.height)
    );
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    if (selector) {
      await page.locator(selector).first().hover().catch(() => {});
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
    }
  }

  protected async scrollToBottom(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
