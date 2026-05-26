import { BaseScraper, type ScrapedJob, type JobFilters } from './base-scraper';
import { logger } from '@/lib/utils/logger';

/**
 * Lever ATS Scraper
 *
 * Two modes:
 *  1. scrapePage(boardUrl) — scrape a specific company's Lever board (browser)
 *  2. searchJobs(filters)  — query 80+ top companies via the public Lever Postings API
 *     (no browser needed, very fast)
 */

const TOP_LEVER_COMPANIES = [
  'netflix','uber','lyft','doordash','instacart','coinbase','robinhood',
  'plaid','chime','affirm','klarna','nubank','revolut','monzo','n26',
  'carta','rippling','lattice','culture-amp','leapsome','hibob',
  'deel','remote','oyster','papaya-global','workmotion',
  'datarobot','c3ai','h2o','weights-biases','comet','mlflow',
  'grafana','influxdata','timescale','questdb','clickhouse',
  'miro','figma','canva','framer','webflow','bubble','glide',
  'notion','coda','craft','obsidian','roamresearch',
  'loom','vidyard','kaltura','brightcove','wistia',
  'intercom','zendesk','freshworks','kustomer','gorgias',
  'klaviyo','drip','omnisend','sendlane','activecampaign',
  'heap','mixpanel','amplitude','june','koala',
  'census','hightouch','segment','rudderstack',
  'drata','vanta','secureframe','sprinto',
  'brex','ramp','airbase','spendesk','pleo',
  'scale','labelbox','appen','surge','dataloop',
  'anduril','shield-ai','palantir','samsara','fleet',
  'benchling','veeva','flatiron','tempus','color',
];

export class LeverScraper extends BaseScraper {
  async scrapePage(boardUrl: string): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      await page.goto(boardUrl, { waitUntil: 'networkidle' });
      await this.delay();

      const company = new URL(boardUrl).pathname.split('/')[1] ?? 'Unknown';

      const rawJobs = await page.evaluate(() => {
        const postings = document.querySelectorAll('.posting');
        return Array.from(postings).map((el) => ({
          externalId: el.getAttribute('data-qa-posting-id') ?? undefined,
          title: el.querySelector('h5')?.textContent?.trim() ?? '',
          location: el.querySelector('.location')?.textContent?.trim() ?? '',
          applyUrl:
            (el.querySelector('a.posting-btn-submit') as HTMLAnchorElement)?.href ??
            (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
        }));
      });

      for (const raw of rawJobs) {
        if (!raw.title || !raw.applyUrl) continue;
        jobs.push({ ...raw, company, description: raw.title, source: 'lever' });
      }

      logger.info(`Lever: scraped ${jobs.length} jobs from ${boardUrl}`);
    } catch (err) {
      logger.error({ err }, 'Lever scrape failed');
    } finally {
      await page.close();
      await this.cleanup();
    }

    return jobs;
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const allJobs: ScrapedJob[] = [];
    const roleLower = (filters.role ?? '').toLowerCase();
    const limit = filters.limit ?? 200;

    const BATCH = 20;
    for (let i = 0; i < TOP_LEVER_COMPANIES.length && allJobs.length < limit; i += BATCH) {
      const batch = TOP_LEVER_COMPANIES.slice(i, i + BATCH);

      const results = await Promise.allSettled(
        batch.map(async (slug) => {
          try {
            const params = new URLSearchParams();
            if (filters.remote === 'remote') params.set('commitment', 'Remote');

            const res = await fetch(
              `https://api.lever.co/v0/postings/${slug}?${params.toString()}`,
              { signal: AbortSignal.timeout(8_000), headers: { Accept: 'application/json' } }
            );
            if (!res.ok) return [];
            const postings: any[] = await res.json();

            return postings
              .filter(p => {
                if (!p.text || !p.hostedUrl) return false;
                if (!roleLower) return true;
                return p.text.toLowerCase().includes(roleLower) ||
                  (p.categories?.team ?? '').toLowerCase().includes(roleLower) ||
                  (p.categories?.department ?? '').toLowerCase().includes(roleLower);
              })
              .slice(0, 20)
              .map((p): ScrapedJob => ({
                externalId: p.id,
                source: 'lever',
                company: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                title: p.text,
                location: p.categories?.location ?? p.categories?.allLocations?.[0] ?? 'Unknown',
                description: p.descriptionPlain?.slice(0, 2000) ?? p.text,
                requirements: p.lists?.map((l: any) => `${l.text}: ${l.content}`).join('\n').slice(0, 1000),
                applyUrl: p.hostedUrl,
                postedAt: p.createdAt ? new Date(p.createdAt) : new Date(),
              }));
          } catch {
            return [];
          }
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') allJobs.push(...r.value);
      }
    }

    logger.info(`Lever API: found ${allJobs.length} jobs`);
    return allJobs.slice(0, limit);
  }
}
