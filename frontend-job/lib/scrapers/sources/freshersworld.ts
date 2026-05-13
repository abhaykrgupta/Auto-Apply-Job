import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class FreersworldScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const role = (filters.role || 'software-developer')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Try fetch + HTML parsing first (no browser needed)
    try {
      jobs.push(...(await this.fetchFromSearch(role, filters)));
      if (jobs.length > 0) {
        logger.info(`Freshersworld fetch: found ${jobs.length} jobs`);
        return jobs;
      }
    } catch (err) {
      logger.warn({ err }, 'Freshersworld search fetch failed, trying RSS');
    }

    // Fallback: RSS feed
    try {
      jobs.push(...(await this.fetchFromRss(filters)));
      if (jobs.length > 0) {
        logger.info(`Freshersworld RSS: found ${jobs.length} jobs`);
        return jobs;
      }
    } catch (err) {
      logger.warn({ err }, 'Freshersworld RSS fallback also failed');
    }

    return jobs;
  }

  private async fetchFromSearch(role: string, filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const searchUrl = `https://www.freshersworld.com/jobs/jobsearch/${role}-jobs-in-india`;
    logger.info(`Freshersworld search: ${searchUrl}`);

    const res = await fetch(searchUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`Freshersworld responded with ${res.status}`);

    const html = await res.text();

    // Extract job data from HTML using regex (server-side, no DOM)
    const jobBlockRe = /<div[^>]+class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]+class="[^"]*job|<\/section|$)/gi;
    const titleRe = /<(?:h2|h3|a)[^>]+class="[^"]*(?:job[-_]title|title|heading)[^"]*"[^>]*>([^<]+)</i;
    const companyRe = /<[^>]+class="[^"]*(?:company[-_]name|employer)[^"]*"[^>]*>([^<]+)</i;
    const locationRe = /<[^>]+class="[^"]*(?:location|city)[^"]*"[^>]*>([^<]+)</i;
    const linkRe = /<a[^>]+href="(\/jobs\/[^"]+)"[^>]*>/i;
    const idRe = /data-id="(\d+)"|\/jobs\/[^/]+\/(\d+)/;

    // Simpler pattern: extract all job listing links
    const allJobLinks = html.matchAll(/href="(https?:\/\/www\.freshersworld\.com\/jobs\/[^"]+)"/g);
    const allTitles = html.matchAll(/title="([^"]{10,100})"[^>]*href="[^"]*freshersworld\.com\/jobs\/[^"]+"/g);

    const seenUrls = new Set<string>();
    const titleArr = Array.from(allTitles);
    let idx = 0;

    for (const linkMatch of allJobLinks) {
      const applyUrl = linkMatch[1];
      if (seenUrls.has(applyUrl)) continue;
      seenUrls.add(applyUrl);

      const idMatch = applyUrl.match(/\/(\d+)\/?(?:\?|$)/);
      const externalId = idMatch?.[1] || `fw-${idx}-${Date.now()}`;
      const title = titleArr[idx]?.[1]?.trim() || `${filters.role || 'Fresher'} Job`;

      if (!title || title.length < 3) { idx++; continue; }

      jobs.push({
        externalId,
        source: 'custom' as const,
        company: 'Unknown',
        title,
        location: filters.location || 'India',
        description: title,
        applyUrl,
        postedAt: new Date(),
      });
      idx++;
      if (jobs.length >= 50) break;
    }

    return jobs;
  }

  private async fetchFromRss(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const rssUrl = 'https://www.freshersworld.com/rss/jobs';
    logger.info(`Freshersworld RSS: ${rssUrl}`);

    const res = await fetch(rssUrl, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Freshersworld RSS responded with ${res.status}`);
    const xml = await res.text();

    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;

    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1];
      const title = this.extractCdata(block, 'title') || this.extractTag(block, 'title');
      const link = this.extractTag(block, 'link') || this.extractTag(block, 'guid');
      const company = this.extractCdata(block, 'author') || this.extractTag(block, 'author') || 'Unknown';
      const pubDate = this.extractTag(block, 'pubDate');

      if (!title || !link) continue;

      // Filter by role keyword if provided
      if (filters.role && !title.toLowerCase().includes(filters.role.toLowerCase().split(' ')[0])) continue;

      const idMatch = link.match(/\/(\d+)\/?(?:\?|$)/);
      const externalId = idMatch?.[1] || `fw-rss-${Buffer.from(link).toString('base64').slice(0, 16)}`;

      jobs.push({
        externalId,
        source: 'custom' as const,
        company: company.trim(),
        title: title.trim(),
        location: filters.location || 'India',
        description: title.trim(),
        applyUrl: link.trim(),
        postedAt: pubDate ? new Date(pubDate) : new Date(),
      });

      if (jobs.length >= 50) break;
    }

    return jobs;
  }

  private extractTag(block: string, tag: string): string {
    const re = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
    return block.match(re)?.[1]?.trim() ?? '';
  }

  private extractCdata(block: string, tag: string): string {
    const re = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
    return block.match(re)?.[1]?.trim() ?? '';
  }
}
