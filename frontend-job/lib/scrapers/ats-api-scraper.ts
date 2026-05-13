/**
 * Tier 0: ATS public JSON API scrapers — zero AI cost, zero browser cost.
 *
 * Greenhouse, Lever, Ashby, and SmartRecruiters all expose free public JSON APIs.
 * We detect which ATS a company uses and call the API directly.
 *
 * Savings vs browser+AI scraping:  ~$2,400/month for 100 users.
 */

import { type ScrapedJob } from './base-scraper';
import { logger } from '@/lib/utils/logger';
import { scrapeWorkableBoard } from './sources/workable';

// ── Type guards ──────────────────────────────────────────────────────────────

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  content: string;
  absolute_url: string;
  updated_at: string;
  departments?: { name: string }[];
}

interface LeverPosting {
  id: string;
  text: string;
  categories: { location: string; team: string };
  descriptionPlain: string;
  hostedUrl: string;
  createdAt: number;
}

interface AshbyPosting {
  id: string;
  title: string;
  isRemote: boolean;
  locationName: string;
  descriptionSocial: string;
  externalLink: string;
  publishedDate: string;
  department?: { name: string };
}

interface SmartRecruitersJob {
  id: string;
  name: string;
  location: { city: string; country: string; remote: boolean };
  experienceLevel: { label: string };
  ref: string;
  releasedDate: string;
}

// ── Detection ────────────────────────────────────────────────────────────────

export type AtsType = 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'workable' | null;

/**
 * Try to determine which ATS a company uses from their website URL or
 * by probing well-known subdomain patterns.
 * Returns the ATS type and the board slug/ID if found.
 */
export async function detectAtsAndSlug(
  companyName: string,
  websiteUrl: string,
): Promise<{ ats: AtsType; slug: string } | null> {
  // Derive a slug from company name (lowercase, hyphens)
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if the websiteUrl itself is an ATS board URL
  try {
    const url = new URL(websiteUrl);
    const host = url.hostname;
    const path = url.pathname;

    if (host.includes('greenhouse.io') || host.includes('boards.greenhouse.io')) {
      const m = path.match(/\/embed\/job_board\/([^/?]+)/i) ?? path.match(/\/([^/?]+)/);
      return { ats: 'greenhouse', slug: m?.[1] ?? slug };
    }
    if (host.includes('lever.co') || host.includes('jobs.lever.co')) {
      const m = path.match(/\/([^/?]+)/);
      return { ats: 'lever', slug: m?.[1] ?? slug };
    }
    if (host.includes('ashbyhq.com') || host.includes('jobs.ashbyhq.com')) {
      const m = path.match(/\/([^/?]+)/);
      return { ats: 'ashby', slug: m?.[1] ?? slug };
    }
    if (host.includes('smartrecruiters.com') || host.includes('jobs.smartrecruiters.com')) {
      const m = path.match(/\/([^/?]+)/);
      return { ats: 'smartrecruiters', slug: m?.[1] ?? slug };
    }
    if (host.includes('workable.com') || host.includes('apply.workable.com')) {
      const m = path.match(/\/([^/?]+)/);
      return { ats: 'workable', slug: m?.[1] ?? slug };
    }
  } catch {
    // invalid URL — fall through to probing
  }

  // Probe public API endpoints (cheap HEAD/GET requests)
  const probes: { ats: AtsType; url: string }[] = [
    { ats: 'greenhouse',      url: `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true` },
    { ats: 'lever',           url: `https://api.lever.co/v0/postings/${slug}?mode=json&limit=1` },
    { ats: 'ashby',           url: `https://api.ashbyhq.com/posting-api/job-board/${slug}` },
    { ats: 'smartrecruiters', url: `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=1` },
    { ats: 'workable',        url: `https://apply.workable.com/api/v3/accounts/${slug}/jobs` },
  ];

  for (const probe of probes) {
    try {
      const isPost = probe.ats === 'workable';
      const res = await fetch(probe.url, {
        method:  isPost ? 'POST' : 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body:    isPost ? JSON.stringify({ query: '', location: [], department: [], worktype: [], remote: [] }) : undefined,
        signal:  AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const hasJobs =
          (probe.ats === 'greenhouse'      && Array.isArray((data as { jobs?: unknown[] }).jobs)) ||
          (probe.ats === 'lever'           && Array.isArray(data)) ||
          (probe.ats === 'ashby'           && Array.isArray((data as { jobPostings?: unknown[] }).jobPostings)) ||
          (probe.ats === 'smartrecruiters' && Array.isArray((data as { content?: unknown[] }).content)) ||
          (probe.ats === 'workable'        && Array.isArray((data as { results?: unknown[] }).results));
        if (hasJobs) return { ats: probe.ats, slug };
      }
    } catch {
      // probe failed — try next
    }
  }

  return null;
}

// ── Scrapers ─────────────────────────────────────────────────────────────────

async function scrapeGreenhouse(slug: string, companyName: string): Promise<ScrapedJob[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) throw new Error(`Greenhouse API ${res.status}`);
  const data = await res.json() as { jobs?: GreenhouseJob[] };
  return (data.jobs ?? []).map((j) => ({
    externalId: String(j.id),
    company:     companyName,
    title:       j.title,
    location:    j.location?.name,
    description: j.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000) ?? '',
    applyUrl:    j.absolute_url,
    postedAt:    j.updated_at ? new Date(j.updated_at) : undefined,
    source:      'greenhouse' as const,
  }));
}

async function scrapeLever(slug: string, companyName: string): Promise<ScrapedJob[]> {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${slug}?mode=json`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) throw new Error(`Lever API ${res.status}`);
  const data = await res.json() as LeverPosting[];
  return data.map((j) => ({
    externalId: j.id,
    company:    companyName,
    title:      j.text,
    location:   j.categories?.location,
    description: j.descriptionPlain?.slice(0, 3000) ?? '',
    applyUrl:   j.hostedUrl,
    postedAt:   j.createdAt ? new Date(j.createdAt) : undefined,
    source:     'lever' as const,
  }));
}

async function scrapeAshby(slug: string, companyName: string): Promise<ScrapedJob[]> {
  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) throw new Error(`Ashby API ${res.status}`);
  const data = await res.json() as { jobPostings?: AshbyPosting[] };
  return (data.jobPostings ?? []).map((j) => ({
    externalId: j.id,
    company:    companyName,
    title:      j.title,
    location:   j.isRemote ? 'Remote' : j.locationName,
    description: j.descriptionSocial?.slice(0, 3000) ?? '',
    applyUrl:   j.externalLink,
    postedAt:   j.publishedDate ? new Date(j.publishedDate) : undefined,
    source:     'ashby' as const,
  }));
}

async function scrapeSmartRecruiters(slug: string, companyName: string): Promise<ScrapedJob[]> {
  const res = await fetch(
    `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) throw new Error(`SmartRecruiters API ${res.status}`);
  const data = await res.json() as { content?: SmartRecruitersJob[] };
  return (data.content ?? []).map((j) => ({
    externalId: j.id,
    company:    companyName,
    title:      j.name,
    location:   j.location?.remote ? 'Remote' : [j.location?.city, j.location?.country].filter(Boolean).join(', '),
    description: '',
    applyUrl:   j.ref ?? `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
    postedAt:   j.releasedDate ? new Date(j.releasedDate) : undefined,
    source:     'custom' as const,
  }));
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Try to scrape jobs via ATS public JSON APIs (Tier 0 — free).
 * Returns null if the company doesn't use a known ATS or the probe fails.
 */
export async function scrapeViaAtsApi(
  companyName: string,
  websiteUrl: string,
): Promise<ScrapedJob[] | null> {
  const detected = await detectAtsAndSlug(companyName, websiteUrl);
  if (!detected) return null;

  const { ats, slug } = detected;
  logger.info({ companyName, ats, slug }, 'ATS API Tier 0 scrape');

  try {
    switch (ats) {
      case 'greenhouse':      return await scrapeGreenhouse(slug, companyName);
      case 'lever':           return await scrapeLever(slug, companyName);
      case 'ashby':           return await scrapeAshby(slug, companyName);
      case 'smartrecruiters': return await scrapeSmartRecruiters(slug, companyName);
      case 'workable':        return await scrapeWorkableBoard(slug, companyName);
      default:                return null;
    }
  } catch (err) {
    logger.warn({ err, companyName, ats }, 'ATS API scrape failed — falling back to browser');
    return null;
  }
}
