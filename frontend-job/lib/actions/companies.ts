'use server';

import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { eq, desc, or, isNull, and, ilike, sql } from 'drizzle-orm';
import { discoveryEngine } from '@/lib/company-discovery/discovery-engine';
import { revalidatePath } from 'next/cache';

export interface CompanyFilters {
  search?:  string;   // name, industry, location
  atsType?: string;   // greenhouse | lever | ashby | workday | ...
  source?:  string;   // yc | github | wellfound | ...
  country?: string;   // india | us | uk | remote | uae | ...
  limit?:   number;
  offset?:  number;
}

// Returns global companies + this user's privately-added companies, with filtering
export async function getCompanies(userId?: string, filters: CompanyFilters = {}) {
  const { search, atsType, source, country, limit = 50, offset = 0 } = filters;

  const safeLimit  = Math.min(Math.max(1, limit),  200);
  const safeOffset = Math.max(0, offset);

  const ownershipCondition = userId
    ? or(isNull(companies.addedByUserId), eq(companies.addedByUserId, userId))
    : isNull(companies.addedByUserId);

  const conditions = [ownershipCondition!];

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      sql`(${companies.name} ILIKE ${term} OR ${companies.industry} ILIKE ${term} OR ${companies.location} ILIKE ${term})`
    );
  }

  if (atsType && atsType !== 'all') {
    conditions.push(ilike(companies.atsType, atsType));
  }

  if (source && source !== 'all') {
    conditions.push(ilike(companies.source, source));
  }

  if (country && country !== 'all') {
    const locationMap: Record<string, string> = {
      india:     '%india%',
      remote:    '%remote%',
      us:        '%united states%',
      uk:        '%united kingdom%',
      canada:    '%canada%',
      germany:   '%germany%',
      australia: '%australia%',
      singapore: '%singapore%',
      uae:       '%united arab emirates%',
    };
    const pattern = locationMap[country.toLowerCase()] ?? `%${country}%`;
    conditions.push(ilike(companies.location, pattern));
  }

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(companies)
      .where(where)
      .orderBy(desc(companies.discoveredAt))
      .limit(safeLimit)
      .offset(safeOffset),
    db.select({ total: sql<number>`count(*)::int` }).from(companies).where(where),
  ]);

  return { data: rows, total, limit: safeLimit, offset: safeOffset };
}

export async function getCompanyStats() {
  const all = await db.select().from(companies);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return {
    total: all.length,
    withJobs: all.filter((c) => (c.activeJobsCount ?? 0) > 0).length,
    totalJobs: all.reduce((sum, c) => sum + (c.activeJobsCount ?? 0), 0),
    thisWeek: all.filter((c) => c.discoveredAt && new Date(c.discoveredAt) >= oneWeekAgo).length,
    easyApply: all.filter(
      (c) => c.atsType === 'greenhouse' || c.atsType === 'lever' || c.atsType === 'ashby'
    ).length,
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
  revalidatePath('/companies');
  return result;
}

export async function addCompanyManually(url: string, userId: string) {
  const company = await discoveryEngine.discoverFromUrl(url);
  if (!company) throw new Error('Could not detect company from URL');

  const slug = `${discoveryEngine.slugify(company.name)}-${userId.slice(0, 8)}`;
  await db
    .insert(companies)
    .values({
      name: company.name,
      slug,
      website: company.website,
      atsType: company.atsType,
      atsUrl: company.atsUrl,
      source: 'manual',
      addedByUserId: userId,
    })
    .onConflictDoNothing();

  revalidatePath('/companies');
  return company;
}

export async function toggleCompanyScraping(id: string, enabled: boolean) {
  await db.update(companies).set({ scrapingEnabled: enabled }).where(eq(companies.id, id));
  revalidatePath('/companies');
}
