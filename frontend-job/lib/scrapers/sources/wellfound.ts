/**
 * Wellfound (AngelList) — the #1 startup job board.
 * Uses the public GraphQL endpoint that powers wellfound.com/jobs.
 * No auth required for basic job search.
 */
import { BaseScraper, type ScrapedJob, type JobFilters } from '../base-scraper';
import { logger } from '@/lib/utils/logger';

interface WellfoundNode {
  id: string;
  title: string;
  slug: string;
  description: string;
  remote: boolean;
  locationNames: string[];
  salary: string | null;
  equityMin: number | null;
  equityMax: number | null;
  jobType: string;
  createdAt: string;
  liveStartAt: string;
  startup: {
    name: string;
    slug: string;
    website: string | null;
    logoUrl: string | null;
    markets: { displayName: string }[];
    funding: string | null;
  };
}

const GQL_QUERY = `
query JobSearchQuery($query: String, $remote: Boolean, $page: Int) {
  jobListings(query: $query, remote: $remote, page: $page, perPage: 50) {
    totalCount
    edges {
      node {
        id title slug description remote locationNames salary
        equityMin equityMax jobType createdAt liveStartAt
        startup {
          name slug website logoUrl funding
          markets { displayName }
        }
      }
    }
  }
}`;

export class WellfoundScraper extends BaseScraper {
  async scrapePage(_url: string): Promise<ScrapedJob[]> {
    return this.searchJobs({});
  }

  async searchJobs(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
      const variables: Record<string, unknown> = {
        query:  filters.role ?? '',
        page:   1,
      };
      if (filters.remote === 'remote') variables.remote = true;

      const res = await fetch('https://wellfound.com/graphql', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
          'User-Agent':    'Mozilla/5.0 (compatible; JobAgent/1.0)',
        },
        body:    JSON.stringify({ query: GQL_QUERY, variables }),
        signal:  AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Wellfound GQL error — using fallback');
        return this.fallback(filters);
      }

      const data = await res.json() as { data?: { jobListings?: { edges?: { node: WellfoundNode }[] } } };
      const edges = data.data?.jobListings?.edges ?? [];

      for (const { node: item } of edges) {
        const location = item.remote ? 'Remote' : (item.locationNames?.[0] ?? 'Unknown');

        jobs.push({
          externalId:  item.id,
          source:      'custom' as const,
          company:     item.startup?.name ?? 'Unknown',
          title:       item.title,
          location,
          locationType: item.remote ? 'remote' : undefined,
          description: item.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000) ?? item.title,
          applyUrl:    `https://wellfound.com/jobs/${item.slug}`,
          postedAt:    item.liveStartAt ? new Date(item.liveStartAt) : new Date(),
        });

        if (jobs.length >= (filters.limit ?? 100)) break;
      }

      logger.info(`Wellfound: found ${jobs.length} jobs`);
    } catch (err) {
      logger.error({ err }, 'Wellfound scraper failed');
      return this.fallback(filters);
    }
    return jobs;
  }

  /** Fallback: use Wellfound's public RSS feed for job listings */
  private async fallback(filters: JobFilters): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
      const role = filters.role ? encodeURIComponent(filters.role) : 'engineer';
      const res  = await fetch(
        `https://wellfound.com/jobs?job_listing_search[query]=${role}&format=json`,
        {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!res.ok) return [];
      const data = await res.json() as { jobs?: WellfoundNode[] };
      for (const item of data.jobs ?? []) {
        jobs.push({
          externalId:  item.id,
          source:      'custom' as const,
          company:     item.startup?.name ?? 'Unknown',
          title:       item.title,
          location:    item.remote ? 'Remote' : (item.locationNames?.[0] ?? 'Unknown'),
          locationType: item.remote ? 'remote' : undefined,
          description: item.description?.slice(0, 3000) ?? item.title,
          applyUrl:    `https://wellfound.com/jobs/${item.slug}`,
          postedAt:    item.liveStartAt ? new Date(item.liveStartAt) : new Date(),
        });
        if (jobs.length >= (filters.limit ?? 100)) break;
      }
    } catch { /* silent */ }
    return jobs;
  }
}
