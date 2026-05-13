import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

export class TimesJobsScraper extends BaseScraper {
  async scrapePage(url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({ role: url });
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const role = encodeURIComponent(filters.role || 'software engineer');
    const location = encodeURIComponent(filters.location || '');

    const rssUrl =
      `https://www.timesjobs.com/candidate/rss.html` +
      `?searchType=personalizedSearch&from=submit` +
      `&txtKeywords=${role}` +
      (filters.location ? `&txtLocation=${location}` : '') +
      `&sequence=1&startPage=1`;

    logger.info(`TimesJobs RSS: ${rssUrl}`);

    try {
      const res = await fetch(rssUrl, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'TimesJobs RSS request failed');
        return jobs;
      }

      const xml = await res.text();
      jobs.push(...this.parseRss(xml, filters));

      logger.info(`TimesJobs: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'TimesJobs RSS fetch failed');
    }

    return jobs;
  }

  private parseRss(xml: string, filters: JobFilters): ScrapedJob[] {
    const jobs: ScrapedJob[] = [];

    // Extract <item> blocks
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRe.exec(xml)) !== null) {
      const block = itemMatch[1];

      const title = this.extractTag(block, 'title');
      const link = this.extractTag(block, 'link') || this.extractTag(block, 'guid');
      const company = this.extractTag(block, 'company') || this.extractCdata(block, 'company') || 'Unknown';
      const locationRaw =
        this.extractTag(block, 'location') ||
        this.extractCdata(block, 'location') ||
        filters.location ||
        'India';
      const description =
        this.extractCdata(block, 'description') ||
        this.extractTag(block, 'description') ||
        title;
      const pubDate = this.extractTag(block, 'pubDate');

      if (!title || !link) continue;

      // Derive a stable externalId from the URL
      const idMatch = link.match(/jobId[=/](\w+)/i) || link.match(/(\d{6,})/);
      const externalId = idMatch?.[1] || `timesjobs-${Buffer.from(link).toString('base64').slice(0, 16)}`;

      jobs.push({
        externalId,
        source: 'custom' as const,
        company: this.stripHtml(company),
        title: this.stripHtml(title),
        location: this.stripHtml(locationRaw),
        description: this.stripHtml(description) || title,
        applyUrl: link.trim(),
        postedAt: pubDate ? new Date(pubDate) : new Date(),
      });
    }

    return jobs;
  }

  private extractTag(block: string, tag: string): string {
    const re = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i');
    return block.match(re)?.[1]?.trim() ?? '';
  }

  private extractCdata(block: string, tag: string): string {
    const re = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
    return block.match(re)?.[1]?.trim() ?? '';
  }

  private stripHtml(str: string): string {
    return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
  }
}
