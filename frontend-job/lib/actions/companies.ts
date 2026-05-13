'use server';

import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { eq, desc, or, isNull } from 'drizzle-orm';
import { discoveryEngine } from '@/lib/company-discovery/discovery-engine';
import { revalidatePath } from 'next/cache';

// Returns global companies + this user's privately-added companies
export async function getCompanies(userId?: string) {
  return db
    .select()
    .from(companies)
    .where(
      userId
        ? or(isNull(companies.addedByUserId), eq(companies.addedByUserId, userId))
        : isNull(companies.addedByUserId)
    )
    .orderBy(desc(companies.discoveredAt));
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
