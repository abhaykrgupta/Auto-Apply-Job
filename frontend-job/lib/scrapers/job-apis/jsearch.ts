/**
 * JSearch API via RapidAPI
 * Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 * Aggregates LinkedIn, Glassdoor, Indeed, ZipRecruiter, etc.
 * Free tier: 200 req/month; Basic: 3000 req/month
 *
 * Required env vars:
 *   JSEARCH_API_KEY — RapidAPI key (from rapidapi.com/letscrape-6bRBa3QguO5)
 */

export interface JSearchJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  isRemote: boolean;
  postedAt?: Date;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
}

export async function fetchJSearchJobs(opts: {
  query: string;
  country?: string;
  datePosted?: 'all' | 'today' | '3days' | 'week' | 'month';
  remoteOnly?: boolean;
  page?: number;
  numPages?: number;
}): Promise<JSearchJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return [];

  const searchQuery = opts.remoteOnly
    ? `${opts.query} remote`
    : opts.country && opts.country !== 'remote'
      ? `${opts.query} in ${opts.country}`
      : opts.query;

  const params = new URLSearchParams({
    query: searchQuery,
    page: String(opts.page ?? 1),
    num_pages: String(opts.numPages ?? 1),
    date_posted: opts.datePosted ?? 'all',
  });

  if (opts.remoteOnly) params.set('remote_jobs_only', 'true');

  try {
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params}`,
      {
        signal: AbortSignal.timeout(20_000),
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.warn(`[JSearch] HTTP ${res.status} for query "${searchQuery}"`);
      return [];
    }

    const data = await res.json();
    return (data.data ?? []).map((j: any): JSearchJob => ({
      externalId: `jsearch-${j.job_id}`,
      title: j.job_title ?? '',
      company: j.employer_name ?? '',
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
      description: j.job_description ?? j.job_title ?? '',
      applyUrl: j.job_apply_link ?? j.job_google_link ?? '',
      isRemote: j.job_is_remote ?? false,
      postedAt: j.job_posted_at_timestamp
        ? new Date(j.job_posted_at_timestamp * 1000)
        : undefined,
      salaryMin: j.job_min_salary ?? undefined,
      salaryMax: j.job_max_salary ?? undefined,
      employmentType: j.job_employment_type ?? undefined,
    })).filter((j: JSearchJob) => j.title && j.applyUrl);
  } catch (err) {
    console.error('[JSearch] fetch failed:', err);
    return [];
  }
}
