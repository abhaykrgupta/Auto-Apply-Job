import { type ATSDetectionResult } from './types';
import { chromium } from 'playwright';
import { logger } from '@/lib/utils/logger';

const ATS_SIGNATURES: Record<string, string[]> = {
  greenhouse: ['greenhouse.io', 'boards.greenhouse.io', 'greenhouse-io'],
  lever: ['lever.co', 'jobs.lever.co', 'lever-co'],
  workday: ['myworkdayjobs.com', 'workday.com/en-us/jobs'],
  ashby: ['ashbyhq.com', 'jobs.ashbyhq.com'],
  bamboohr: ['bamboohr.com', 'app.bamboohr.com'],
  smartrecruiters: ['smartrecruiters.com', 'careers.smartrecruiters.com'],
  icims: ['icims.com', 'careers.icims.com'],
  rippling: ['rippling.com/jobs'],
  notion: ['notion.so/careers'],
};

export async function detectATS(url: string): Promise<ATSDetectionResult> {
  if (!url) return { type: 'none', url: null };

  // Check URL pattern first (fast path)
  const urlLower = url.toLowerCase();
  for (const [ats, patterns] of Object.entries(ATS_SIGNATURES)) {
    if (patterns.some((p) => urlLower.includes(p))) {
      return { type: ats as ATSDetectionResult['type'], url };
    }
  }

  // Try to detect from page content (slower path)
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const finalUrl = page.url();
    const htmlSnippet = await page.evaluate(() =>
      document.documentElement.innerHTML.substring(0, 5000)
    );

    await page.close();

    // Check redirected URL
    const finalUrlLower = finalUrl.toLowerCase();
    for (const [ats, patterns] of Object.entries(ATS_SIGNATURES)) {
      if (patterns.some((p) => finalUrlLower.includes(p))) {
        return { type: ats as ATSDetectionResult['type'], url: finalUrl };
      }
    }

    // Check page HTML
    const htmlLower = htmlSnippet.toLowerCase();
    for (const [ats, patterns] of Object.entries(ATS_SIGNATURES)) {
      if (patterns.some((p) => htmlLower.includes(p.replace('.', '')))) {
        return { type: ats as ATSDetectionResult['type'], url };
      }
    }

    return { type: 'custom', url };
  } catch {
    return { type: 'unknown', url };
  } finally {
    await browser?.close();
  }
}

export async function findCareerPage(website: string): Promise<string | null> {
  if (!website) return null;

  const base = website.replace(/\/$/, '');
  const paths = [
    '/careers',
    '/jobs',
    '/work-with-us',
    '/join-us',
    '/join',
    '/company/careers',
    '/about/careers',
    '/team/careers',
    '/hiring',
    '/open-positions',
  ];

  // Try HEAD requests first (fast)
  for (const p of paths) {
    try {
      const url = `${base}${p}`;
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
        redirect: 'follow',
      });
      if (res.ok) return url;
    } catch {
      // continue
    }
  }

  // Scrape homepage for career link
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const link = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const found = anchors.find((a) =>
        /career|job|join|work with us|we.re hiring|open role/i.test(
          (a as HTMLAnchorElement).textContent + (a as HTMLAnchorElement).href
        )
      );
      return (found as HTMLAnchorElement)?.href ?? null;
    });

    await page.close();
    return link;
  } catch {
    return null;
  } finally {
    await browser?.close();
  }
}
