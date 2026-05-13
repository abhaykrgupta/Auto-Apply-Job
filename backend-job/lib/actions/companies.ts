

import { db } from '@/lib/db';
import { companies, jobs } from '@/lib/db/schema';
import { eq, desc, gte, count, sum } from 'drizzle-orm';
import { discoveryEngine } from '@/lib/company-discovery/discovery-engine';

export async function getCompanies() {
  return db.select().from(companies).orderBy(desc(companies.discoveredAt));
}

export async function getCompanyStats() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel for performance
  const [all, jobsThisWeek] = await Promise.all([
    db.select().from(companies),
    db
      .select({ count: count() })
      .from(jobs)
      .where(gte(jobs.createdAt, oneWeekAgo)),
  ]);

  const totalJobs = all.reduce((s, c) => s + (c.activeJobsCount ?? 0), 0);

  return {
    total: all.length,
    withJobs: all.filter((c) => (c.activeJobsCount ?? 0) > 0).length,
    totalJobs,
    // Jobs found (scraped/fetched) in the last 7 days — not companies discovered
    thisWeek: jobsThisWeek[0]?.count ?? 0,
    // Jobs at companies with streamlined apply (Greenhouse / Lever / Ashby)
    easyApply: all
      .filter((c) => ['greenhouse', 'lever', 'ashby'].includes(c.atsType ?? ''))
      .reduce((s, c) => s + (c.activeJobsCount ?? 0), 0),
    bySource: all.reduce((acc, c) => {
      const src = c.source ?? 'unknown';
      acc[src] = (acc[src] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byAts: all.reduce((acc, c) => {
      const ats = c.atsType ?? 'unknown';
      acc[ats] = (acc[ats] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export async function runDiscovery(sources?: string[]) {
  const result = await discoveryEngine.runFullDiscovery({
    sources: (sources ?? ['seed', 'yc', 'github']) as any,
    skipAtsDetection: true,
  });
  return result;
}

export async function addCompanyManually(url: string) {
  const company = await discoveryEngine.discoverFromUrl(url);
  if (!company) throw new Error('Could not detect company from URL');

  const slug = discoveryEngine.slugify(company.name);
  await db
    .insert(companies)
    .values({
      name: company.name,
      slug,
      website: company.website,
      atsType: company.atsType,
      atsUrl: company.atsUrl,
      source: 'manual',
    })
    .onConflictDoNothing();

  return company;
}

export async function toggleCompanyScraping(id: string, enabled: boolean) {
  await db.update(companies).set({ scrapingEnabled: enabled }).where(eq(companies.id, id));
}
