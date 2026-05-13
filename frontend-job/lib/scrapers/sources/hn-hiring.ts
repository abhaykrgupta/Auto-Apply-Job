/**
 * Hacker News "Who is Hiring" — monthly thread, pure startups.
 * Uses the HN Algolia search API (free, no auth).
 * Parses comment text to extract job details.
 *
 * Thread pattern: "Ask HN: Who is hiring? (Month Year)"
 */
import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

interface HNHit {
  objectID: string;
  author: string;
  comment_text: string;
  parent_id: number;
  created_at: string;
}

interface HNSearchResult {
  hits: HNHit[];
}

// Cache the latest thread ID for the month
let cachedThreadId: number | null = null;
let cachedMonth: string = '';

async function getLatestHiringThreadId(): Promise<number | null> {
  const month = new Date().toISOString().slice(0, 7);
  if (cachedThreadId && cachedMonth === month) return cachedThreadId;

  try {
    const res = await fetch(
      'https://hn.algolia.com/api/v1/search?query=Ask+HN+Who+is+hiring&tags=ask_hn&hitsPerPage=5',
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json() as { hits: { objectID: string; title: string }[] };
    const thread = data.hits.find((h) => /who is hiring/i.test(h.title));
    if (!thread) return null;
    cachedThreadId = Number(thread.objectID);
    cachedMonth = month;
    return cachedThreadId;
  } catch {
    return null;
  }
}

/** Very lightweight parser — extracts company | role | location | remote from first line of HN comment. */
function parseHNComment(text: string, id: string, postedAt: Date): ScrapedJob | null {
  if (!text || text.length < 20) return null;

  // Strip HTML
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const firstLine = clean.split('\n')[0].slice(0, 300);

  // Typical format: "Acme Inc | Senior Engineer | Remote | Full-time | ..."
  const parts = firstLine.split(/\s*[|•·]\s*/);
  const company = parts[0]?.trim().slice(0, 80);
  const title   = parts[1]?.trim().slice(0, 100) || 'Software Engineer';
  if (!company || company.length < 2) return null;

  const isRemote = /remote/i.test(firstLine);
  const location = isRemote ? 'Remote' : (parts[2]?.trim().slice(0, 60) || 'Unknown');

  return {
    externalId:  `hn-${id}`,
    source:      'custom' as const,
    company,
    title,
    location,
    locationType: isRemote ? 'remote' : undefined,
    description: clean.slice(0, 3000),
    applyUrl:    `https://news.ycombinator.com/item?id=${id}`,
    postedAt,
  };
}

export class HNHiringScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
      const threadId = await getLatestHiringThreadId();
      if (!threadId) { logger.warn('HN Hiring: could not find thread'); return []; }

      // Fetch top-level comments (direct replies to the thread = job postings)
      const params = new URLSearchParams({
        tags:        `comment,story_${threadId}`,
        hitsPerPage: '200',
      });
      if (filters.role) params.set('query', filters.role);

      const res = await fetch(`https://hn.algolia.com/api/v1/search?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { logger.warn({ status: res.status }, 'HN Algolia error'); return []; }

      const data = await res.json() as HNSearchResult;

      for (const hit of data.hits) {
        const job = parseHNComment(hit.comment_text, hit.objectID, new Date(hit.created_at));
        if (!job) continue;

        // Role filter
        if (filters.role) {
          const q = filters.role.toLowerCase();
          if (!job.title.toLowerCase().includes(q) && !job.description.toLowerCase().includes(q)) continue;
        }

        jobs.push(job);
        if (jobs.length >= (filters.limit ?? 100)) break;
      }

      logger.info(`HN Hiring: found ${jobs.length} jobs from thread ${threadId}`);
    } catch (err) {
      logger.error({ err }, 'HN Hiring scraper failed');
    }
    return jobs;
  }
}
