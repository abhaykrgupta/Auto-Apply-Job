import { db } from '@/lib/db';
import { companies as companiesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { type DiscoveredCompany } from './types';
import { detectATS, findCareerPage } from './ats-detector';
import { scrapeYCombinator } from './sources/yc';
import { scrapeGitHubTrending } from './sources/github';
import { scrapeVCPortfolios } from './sources/vc-portfolios';
import { scrapeWellfound } from './sources/wellfound';
import { getKnownCompanies } from './sources/tech-companies';
import { logger } from '@/lib/utils/logger';
import pLimit from 'p-limit';

export class DiscoveryEngine {
  private concurrencyLimit = pLimit(3);

  async runFullDiscovery(options?: {
    sources?: Array<'yc' | 'github' | 'vc' | 'wellfound' | 'seed'>;
    skipAtsDetection?: boolean;
  }): Promise<{ total: number; newCompanies: number; sources: Record<string, number> }> {
    const sources = options?.sources ?? ['seed', 'yc', 'github'];
    const sourceResults: Record<string, number> = {};
    let allDiscovered: DiscoveredCompany[] = [];

    logger.info(`Starting discovery with sources: ${sources.join(', ')}`);

    if (sources.includes('seed')) {
      const seed = getKnownCompanies();
      allDiscovered.push(...seed);
      sourceResults['seed'] = seed.length;
    }

    if (sources.includes('yc')) {
      try {
        const yc = await scrapeYCombinator();
        allDiscovered.push(...yc);
        sourceResults['yc'] = yc.length;
      } catch (err) {
        logger.error({ err }, 'YC discovery failed');
        sourceResults['yc'] = 0;
      }
    }

    if (sources.includes('github')) {
      try {
        const gh = await scrapeGitHubTrending();
        allDiscovered.push(...gh);
        sourceResults['github'] = gh.length;
      } catch (err) {
        logger.error({ err }, 'GitHub discovery failed');
        sourceResults['github'] = 0;
      }
    }

    if (sources.includes('vc')) {
      try {
        const vc = await scrapeVCPortfolios();
        allDiscovered.push(...vc);
        sourceResults['vc'] = vc.length;
      } catch (err) {
        logger.error({ err }, 'VC portfolio discovery failed');
        sourceResults['vc'] = 0;
      }
    }

    if (sources.includes('wellfound')) {
      try {
        const wf = await scrapeWellfound();
        allDiscovered.push(...wf);
        sourceResults['wellfound'] = wf.length;
      } catch (err) {
        logger.error({ err }, 'Wellfound discovery failed');
        sourceResults['wellfound'] = 0;
      }
    }

    const total = allDiscovered.length;
    logger.info(`Total discovered: ${total} companies`);

    const unique = this.deduplicate(allDiscovered);
    logger.info(`After dedup: ${unique.length} unique companies`);

    let newCount = 0;
    for (const company of unique) {
      const isNew = await this.saveCompany(company, options?.skipAtsDetection ?? true);
      if (isNew) newCount++;
    }

    logger.info(`Discovery done: ${newCount} new companies saved`);
    return { total, newCompanies: newCount, sources: sourceResults };
  }

  async discoverFromUrl(url: string): Promise<DiscoveredCompany | null> {
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const ats = await detectATS(normalizedUrl);
      const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, '');
      const slug = hostname.split('.')[0];
      const name = slug.charAt(0).toUpperCase() + slug.slice(1);

      return {
        name,
        website: normalizedUrl,
        atsType: ats.type,
        atsUrl: ats.url ?? normalizedUrl,
        source: 'manual',
      };
    } catch {
      return null;
    }
  }

  private deduplicate(companies: DiscoveredCompany[]): DiscoveredCompany[] {
    const seen = new Map<string, DiscoveredCompany>();

    for (const company of companies) {
      const key = this.slugify(company.name);
      if (!key) continue;

      if (!seen.has(key)) {
        seen.set(key, company);
      } else {
        // Merge: keep fields that have values
        const existing = seen.get(key)!;
        const merged: DiscoveredCompany = { ...existing };
        for (const [k, v] of Object.entries(company)) {
          if (v !== undefined && v !== null && v !== '') {
            (merged as any)[k] = v;
          }
        }
        seen.set(key, merged);
      }
    }

    return Array.from(seen.values());
  }

  private async saveCompany(company: DiscoveredCompany, skipAts: boolean): Promise<boolean> {
    const slug = this.slugify(company.name);
    if (!slug) return false;

    try {
      const existing = await db
        .select({ id: companiesTable.id })
        .from(companiesTable)
        .where(eq(companiesTable.slug, slug))
        .limit(1);

      if (existing.length > 0) {
        // Update with new data only
        await db
          .update(companiesTable)
          .set({
            ...(company.atsType && { atsType: company.atsType }),
            ...(company.atsUrl && { atsUrl: company.atsUrl }),
            ...(company.careerPage && { careerPage: company.careerPage }),
            ...(company.description && { description: company.description }),
            updatedAt: new Date(),
          })
          .where(eq(companiesTable.slug, slug));
        return false;
      }

      // Detect ATS if not known and not skipped
      let { atsType, atsUrl, careerPage } = company;

      if (!skipAts && company.website && !atsType) {
        await this.concurrencyLimit(async () => {
          try {
            const career = await findCareerPage(company.website!);
            if (career) {
              careerPage = career;
              const ats = await detectATS(career);
              atsType = ats.type;
              atsUrl = ats.url ?? career;
            }
          } catch {
            // skip
          }
        });
      }

      await db.insert(companiesTable).values({
        name: company.name,
        slug,
        website: company.website,
        careerPage,
        atsType,
        atsUrl,
        description: company.description,
        industry: company.industry,
        employeeCount: company.employeeCount,
        location: company.location,
        fundingStage: company.fundingStage,
        logoUrl: company.logoUrl,
        tags: company.tags,
        source: company.source,
        isActive: true,
        scrapingEnabled: true,
      });

      return true;
    } catch (err) {
      logger.error({ err, name: company.name }, 'Failed to save company');
      return false;
    }
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }
}

export const discoveryEngine = new DiscoveryEngine();
