import { chromium } from 'playwright';
import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

/**
 * Scrapes India-focused VC portfolio pages to discover funded Indian startups.
 * Sources: Sequoia India (Peak XV), Accel India, Blume Ventures, Matrix Partners India,
 * Nexus Venture Partners, Kalaari Capital, Lightspeed India, 3one4 Capital.
 */

const INDIA_VC_SOURCES = [
  {
    name: 'Blume Ventures',
    url: 'https://blume.vc/portfolio',
    source: 'blume',
    selector: 'h3, h2, [class*="name"], [class*="company"], .portfolio-company, article h2, article h3',
  },
  {
    name: 'Kalaari Capital',
    url: 'https://www.kalaari.com/portfolio/',
    source: 'kalaari',
    selector: 'h3, h2, [class*="name"], [class*="company"]',
  },
  {
    name: '3one4 Capital',
    url: 'https://3one4capital.com/portfolio',
    source: '3one4',
    selector: 'h3, h2, [class*="name"], [class*="company"], .portfolio h3',
  },
];

export async function scrapeIndiaVCs(): Promise<DiscoveredCompany[]> {
  logger.info('Scraping India VC portfolio companies...');
  const allCompanies: DiscoveredCompany[] = [];

  for (const vc of INDIA_VC_SOURCES) {
    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.goto(vc.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Scroll to load lazy content
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await page.waitForTimeout(600);
      }

      const names = await page.evaluate((selector: string) => {
        const els = document.querySelectorAll(selector);
        const seen = new Set<string>();
        const results: string[] = [];
        els.forEach((el) => {
          const text = el.textContent?.trim();
          if (text && text.length >= 2 && text.length < 60 && !seen.has(text)) {
            // Filter out navigation/UI noise
            const lower = text.toLowerCase();
            if (
              lower.includes('portfolio') ||
              lower.includes('menu') ||
              lower.includes('home') ||
              lower.includes('about') ||
              lower.includes('team') ||
              lower.includes('contact') ||
              lower.includes('blog') ||
              lower.includes('news')
            ) return;
            seen.add(text);
            results.push(text);
          }
        });
        return results.slice(0, 150);
      }, vc.selector);

      for (const name of names) {
        allCompanies.push({
          name,
          location: 'India',
          source: vc.source,
          tags: ['india', 'vc-backed', 'startup'],
          fundingStage: 'series-a+',
        });
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
