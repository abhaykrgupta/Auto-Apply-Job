import { chromium } from 'playwright';
import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

export async function scrapeYCombinator(): Promise<DiscoveredCompany[]> {
  logger.info('Scraping Y Combinator companies...');
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.goto('https://www.ycombinator.com/companies', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Scroll to load all companies
    let previousHeight = 0;
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
      await page.waitForTimeout(1500);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === previousHeight) break;
      previousHeight = newHeight;
    }

    const companies = await page.evaluate(() => {
      // YC uses React with various class names — target company links
      const cards = document.querySelectorAll('a[href*="/companies/"]');
      const seen = new Set<string>();
      const results: Array<{
        name: string;
        website: string | null;
        description: string | null;
        batch: string | null;
        tags: string[];
      }> = [];

      cards.forEach((card) => {
        const nameEl = card.querySelector('span.font-bold, h3, [class*="name"]');
        const name = nameEl?.textContent?.trim();
        if (!name || seen.has(name)) return;
        seen.add(name);

        const descEl = card.querySelector('span.text-sm, p, [class*="desc"]');
        const batchEl = card.querySelector('[class*="batch"]');
        const tagEls = card.querySelectorAll('[class*="tag"], [class*="pill"]');

        results.push({
          name,
          website: null, // fetched separately
          description: descEl?.textContent?.trim() ?? null,
          batch: batchEl?.textContent?.trim() ?? null,
          tags: Array.from(tagEls).map((t) => t.textContent?.trim() ?? '').filter(Boolean),
        });
      });

      return results;
    });

    logger.info(`YC: found ${companies.length} companies`);

    return companies.map((c) => ({
      name: c.name,
      description: c.description ?? undefined,
      batch: c.batch ?? undefined,
      tags: c.tags,
      source: 'ycombinator',
      fundingStage: 'seed',
    }));
  } catch (err) {
    logger.error({ err }, 'YC scrape failed');
    return [];
  } finally {
    await browser?.close();
  }
}
