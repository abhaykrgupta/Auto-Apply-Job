/**
 * Adzuna Job Search API
 * Docs: https://developer.adzuna.com/
 * Free tier: 250 req/day, 50 results/req  ⟹ up to 12,500 jobs/day for free
 *
 * Required env vars:
 *   ADZUNA_APP_ID   — from developer.adzuna.com
 *   ADZUNA_APP_KEY  — from developer.adzuna.com
 */

export interface AdzunaJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAt?: Date;
}

const COUNTRY_CODES: Record<string, string> = {
  us: 'us',
  uk: 'gb',
  gb: 'gb',
  india: 'in',
  in: 'in',
  canada: 'ca',
  ca: 'ca',
  australia: 'au',
  au: 'au',
  germany: 'de',
  de: 'de',
  france: 'fr',
  fr: 'fr',
  singapore: 'sg',
  sg: 'sg',
  netherlands: 'nl',
  nl: 'nl',
};

export async function fetchAdzunaJobs(opts: {
  query: string;
  country?: string;
  locationRaw?: string;
  page?: number;
  resultsPerPage?: number;
  maxDaysOld?: number;
}): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) return [];

  const countryKey = opts.country?.toLowerCase() ?? 'us';
  const cc = COUNTRY_CODES[countryKey] ?? 'us';
  const page = opts.page ?? 1;
  const results = opts.resultsPerPage ?? 50;

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(results),
    what: opts.query,
    content_type: 'application/json',
  });

  if (opts.locationRaw) params.set('where', opts.locationRaw);
  if (opts.maxDaysOld) params.set('max_days_old', String(opts.maxDaysOld));

  const url = `https://api.adzuna.com/v1/api/jobs/${cc}/search/${page}?${params}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[Adzuna] HTTP ${res.status} for query "${opts.query}" in ${cc}`);
      return [];
    }

    const data = await res.json();
    return (data.results ?? []).map((j: any): AdzunaJob => ({
      externalId: `adzuna-${j.id}`,
      title: j.title ?? '',
      company: j.company?.display_name ?? '',
      location: j.location?.display_name ?? '',
      description: j.description ?? j.title ?? '',
      applyUrl: j.redirect_url ?? j.apply_url ?? '',
      salaryMin: j.salary_min ?? undefined,
      salaryMax: j.salary_max ?? undefined,
      postedAt: j.created ? new Date(j.created) : undefined,
    })).filter((j: AdzunaJob) => j.title && j.applyUrl);
  } catch (err) {
    console.error('[Adzuna] fetch failed:', err);
    return [];
  }
}
