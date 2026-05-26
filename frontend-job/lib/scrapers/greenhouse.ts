import { BaseScraper, type ScrapedJob, type JobFilters } from './base-scraper';
import { logger } from '@/lib/utils/logger';

/**
 * Greenhouse ATS Scraper
 *
 * Two modes:
 *  1. scrapePage(boardUrl) — scrape a specific company's Greenhouse board (browser)
 *  2. searchJobs(filters)  — query 100+ top companies via the public Greenhouse Jobs API
 *     (no browser needed, very fast)
 */

// Top 120 tech companies on Greenhouse — covers majority of posted SWE roles
const TOP_GREENHOUSE_COMPANIES = [
  'airbnb','stripe','notion','figma','databricks','scale','anthropic','openai',
  'huggingface','cohere','mistral','perplexity','groq','together','anyscale',
  'modal','replit','cursor','linear','vercel','supabase','planetscale','neon',
  'turso','convex','clerk','resend','posthog','segment','mixpanel','amplitude',
  'datadog','newrelic','dynatrace','elastic','splunk','hashicorp','confluent',
  'dbtlabs','fivetran','airbyte','hightouch','census','metabase','looker',
  'thoughtspot','hex','mode','retool','appsmith','budibase','n8n','zapier',
  'airtable','coda','notion','clickup','asana','monday','jira','linear',
  'github','gitlab','bitbucket','sentry','pagerduty','incident','rootly',
  'cloudflare','fastly','akamai','netlify','fly','railway','render',
  'digitalocean','linode','vultr','hetzner','ovhcloud','scaleway',
  'twilio','sendgrid','vonage','bandwidth','messagebird','plivo',
  'brex','ramp','mercury','stripe','adyen','checkout','marqeta',
  'rippling','gusto','justworks','bamboohr','workday','sage',
  'zendesk','intercom','freshdesk','helpscout','crisp','drift',
  'hubspot','salesloft','outreach','gong','chorus','clari',
  'snowflake','databricks','starburst','dremio','firebolt','clickhouse',
  'mongodb','couchbase','cockroachlabs','yugabyte','tidb','singlestore',
  'redis','memcached','dragonflydb','keydb',
];

export class GreenhouseScraper extends BaseScraper {
  async scrapePage(boardUrl: string): Promise<ScrapedJob[]> {
    await this.setup();
    const page = await this.browser!.newPage();
    const jobs: ScrapedJob[] = [];

    try {
      await page.goto(boardUrl, { waitUntil: 'networkidle' });
      await this.delay();

      const company = new URL(boardUrl).pathname.split('/')[2] ?? 'Unknown';

      const rawJobs = await page.evaluate(() => {
        const elements = document.querySelectorAll('.opening');
        return Array.from(elements).map((el) => ({
          externalId: el.getAttribute('data-id') ?? undefined,
          title: el.querySelector('.opening-title')?.textContent?.trim() ?? '',
          location: el.querySelector('.location')?.textContent?.trim() ?? '',
          applyUrl: (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
        }));
      });

      for (const raw of rawJobs) {
        if (!raw.title || !raw.applyUrl) continue;
        jobs.push({ ...raw, company, description: raw.title, source: 'greenhouse' });
      }

      logger.info(`Greenhouse: scraped ${jobs.length} jobs from ${boardUrl}`);
    } catch (err) {
      logger.error({ err }, 'Greenhouse scrape failed');
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

    // Query top companies in parallel batches of 20
    const BATCH = 20;
    for (let i = 0; i < TOP_GREENHOUSE_COMPANIES.length && allJobs.length < limit; i += BATCH) {
      const batch = TOP_GREENHOUSE_COMPANIES.slice(i, i + BATCH);

      const results = await Promise.allSettled(
        batch.map(async (slug) => {
          try {
            const res = await fetch(
              `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=false`,
              { signal: AbortSignal.timeout(8_000), headers: { Accept: 'application/json' } }
            );
            if (!res.ok) return [];
            const data = await res.json();
            const jobList: any[] = data.jobs ?? [];

            return jobList
              .filter(j => {
                if (!j.title || !j.absolute_url) return false;
                if (!roleLower) return true;
                return j.title.toLowerCase().includes(roleLower) ||
                  (j.departments ?? []).some((d: any) =>
                    d.name?.toLowerCase().includes(roleLower)
                  );
              })
              .slice(0, 20)
              .map((j): ScrapedJob => ({
                externalId: String(j.id),
                source: 'greenhouse',
                company: data.company?.name ?? slug,
                title: j.title,
                location: j.location?.name ?? 'Unknown',
                description: j.title,
                applyUrl: j.absolute_url,
                postedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
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

    logger.info(`Greenhouse API: found ${allJobs.length} jobs`);
    return allJobs.slice(0, limit);
  }
}
