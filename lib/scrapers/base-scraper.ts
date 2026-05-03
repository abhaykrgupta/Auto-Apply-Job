import { chromium, type Browser, type Page } from 'playwright';
import { logger } from '@/lib/utils/logger';

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
}

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected requestDelay: number;

  constructor() {
    this.requestDelay = parseInt(process.env.SCRAPER_REQUEST_DELAY_MS ?? '2000');
  }

  abstract scrapePage(url: string): Promise<ScrapedJob[]>;
  abstract searchJobs(filters: JobFilters): Promise<ScrapedJob[]>;

  protected async setup() {
    this.browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    logger.info('Browser launched');
  }

  protected async cleanup() {
    await this.browser?.close();
    this.browser = null;
    logger.info('Browser closed');
  }

  protected async delay(ms?: number) {
    await new Promise((resolve) => setTimeout(resolve, ms ?? this.requestDelay));
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
