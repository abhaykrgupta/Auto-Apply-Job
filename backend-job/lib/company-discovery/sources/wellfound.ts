import { chromium } from 'playwright';
import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

export async function scrapeWellfound(): Promise<DiscoveredCompany[]> {
  logger.info('Scraping Wellfound companies...');
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.goto('https://wellfound.com/companies', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await page.waitForTimeout(2000);
    }

    const companies = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-test="CompanyCard"], [class*="styles_companyCard"], article');
      const results: Array<{
        name: string;
        description: string | null;
        tags: string[];
        employeeCount: string | null;
        fundingStage: string | null;
      }> = [];

      cards.forEach((card) => {
        const nameEl = card.querySelector('h2, h3, [class*="name"]');
        const name = nameEl?.textContent?.trim();
        if (!name || name.length > 80) return;

        const descEl = card.querySelector('p, [class*="description"]');
        const tagEls = card.querySelectorAll('[class*="tag"], [class*="badge"], [class*="pill"]');
        const empEl = card.querySelector('[class*="employee"], [class*="size"], [class*="team"]');
        const fundEl = card.querySelector('[class*="funding"], [class*="stage"], [class*="series"]');

        results.push({
          name,
          description: descEl?.textContent?.trim() ?? null,
          tags: Array.from(tagEls)
            .map((t) => t.textContent?.trim() ?? '')
            .filter(Boolean)
            .slice(0, 5),
          employeeCount: empEl?.textContent?.trim() ?? null,
          fundingStage: fundEl?.textContent?.trim() ?? null,
        });
      });

      return results;
    });

    logger.info(`Wellfound: found ${companies.length} companies`);

    return companies.map((c) => ({
      name: c.name,
      description: c.description ?? undefined,
      tags: c.tags,
      employeeCount: c.employeeCount ?? undefined,
      fundingStage: c.fundingStage ?? undefined,
      source: 'wellfound',
    }));
  } catch (err) {
    logger.error({ err }, 'Wellfound scrape failed');
    return [];
  } finally {
    await browser?.close();
  }
}
