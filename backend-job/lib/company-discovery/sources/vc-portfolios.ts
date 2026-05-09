import { chromium } from 'playwright';
import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

const VC_SOURCES = [
  {
    name: 'Andreessen Horowitz',
    url: 'https://a16z.com/portfolio/',
    source: 'a16z',
    selector: 'h3, h2, .portfolio-company-name, [class*="company-name"]',
  },
  {
    name: 'Sequoia Capital',
    url: 'https://www.sequoiacap.com/companies/',
    source: 'sequoia',
    selector: 'h3, h2, [class*="company"]',
  },
];

export async function scrapeVCPortfolios(): Promise<DiscoveredCompany[]> {
  logger.info('Scraping VC portfolio companies...');
  const allCompanies: DiscoveredCompany[] = [];

  for (const vc of VC_SOURCES) {
    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.goto(vc.url, { waitUntil: 'domcontentloaded', timeout: 20000 });

      const names = await page.evaluate((selector: string) => {
        const els = document.querySelectorAll(selector);
        const seen = new Set<string>();
        const results: string[] = [];
        els.forEach((el) => {
          const text = el.textContent?.trim();
          if (text && text.length > 1 && text.length < 60 && !seen.has(text)) {
            seen.add(text);
            results.push(text);
          }
        });
        return results.slice(0, 100);
      }, vc.selector);

      for (const name of names) {
        allCompanies.push({ name, source: vc.source, tags: ['vc-backed'] });
      }
      logger.info(`${vc.name}: found ${names.length} companies`);
    } catch (err) {
      logger.warn({ err }, `Failed to scrape ${vc.name}`);
    } finally {
      await browser?.close();
    }
  }

  return allCompanies;
}
