import { db } from '@/lib/db';
import { scraperMemory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { type Page } from 'playwright';

export interface StoredSelectors {
  jobContainer: string;   // CSS selector for each job item row/card
  title: string;          // CSS selector for job title (within container)
  location: string;       // CSS selector for location (within container)
  applyLink: string;      // CSS selector for apply URL (within container)
  pagination?: string;    // CSS selector for "next page" button
}

export interface ScraperMemoryRecord {
  id: string;
  domain: string;
  atsType: string | null;
  domHash: string;
  selectors: StoredSelectors;
  paginationStrategy: string | null;
  extractionStrategy: string;
  confidenceScore: number;
  successCount: number;
  attemptCount: number;
  parserVersion: number;
}

/** Minimum confidence to trust stored selectors without GPT fallback */
const CONFIDENCE_THRESHOLD = 0.65;

/** Well-known job listing CSS patterns to probe before calling GPT */
const COMMON_JOB_SELECTORS: Array<Pick<StoredSelectors, 'jobContainer' | 'title' | 'location' | 'applyLink'>> = [
  { jobContainer: 'li.job', title: 'a', location: '.location', applyLink: 'a' },
  { jobContainer: '.job-item', title: '.job-title', location: '.job-location', applyLink: 'a' },
  { jobContainer: '.job-listing', title: 'h3, h2, .title', location: '.location', applyLink: 'a' },
  { jobContainer: '.opening', title: '.opening-title', location: '.opening-location', applyLink: 'a' },
  { jobContainer: '[class*="job-card"]', title: '[class*="title"]', location: '[class*="location"]', applyLink: 'a' },
  { jobContainer: '[class*="position"]', title: '[class*="title"]', location: '[class*="location"]', applyLink: 'a' },
  { jobContainer: 'article.job', title: 'h2, h3', location: '.location', applyLink: 'a' },
  { jobContainer: '.vacancy', title: '.vacancy-title, h3', location: '.location', applyLink: 'a' },
  { jobContainer: 'tr.job', title: 'td:first-child', location: 'td:nth-child(2)', applyLink: 'a' },
  { jobContainer: '.role', title: '.role-title', location: '.role-location', applyLink: 'a' },
  { jobContainer: '[data-job]', title: '[data-title], h3', location: '[data-location]', applyLink: 'a' },
  { jobContainer: '.posting', title: '.posting-title, h3', location: '.posting-location', applyLink: 'a' },
];

export class ScraperMemoryService {
  /**
   * Look up a stored extraction strategy for this domain + DOM fingerprint.
   * Returns null if no high-confidence strategy exists.
   */
  async lookup(domain: string, domHash: string): Promise<ScraperMemoryRecord | null> {
    try {
      const rows = await db
        .select()
        .from(scraperMemory)
        .where(and(eq(scraperMemory.domain, domain), eq(scraperMemory.domHash, domHash)))
        .limit(1);

      if (!rows.length) return null;

      const row = rows[0];
      if (row.confidenceScore < CONFIDENCE_THRESHOLD) {
        logger.debug({ domain, confidence: row.confidenceScore }, 'Scraper memory below threshold — using AI');
        return null;
      }

      return {
        id: row.id,
        domain: row.domain,
        atsType: row.atsType,
        domHash: row.domHash,
        selectors: row.selectorsJson as StoredSelectors,
        paginationStrategy: row.paginationStrategy,
        extractionStrategy: row.extractionStrategy,
        confidenceScore: row.confidenceScore,
        successCount: row.successCount,
        attemptCount: row.attemptCount,
        parserVersion: row.parserVersion,
      };
    } catch (err) {
      logger.debug({ err, domain }, 'Scraper memory lookup failed — continuing without cache');
      return null;
    }
  }

  /**
   * Attempt to extract jobs using stored selectors.
   * Returns null if selectors yield no results (triggers AI fallback).
   */
  async tryExtractWithSelectors(
    page: Page,
    record: ScraperMemoryRecord,
    companyName: string,
    baseUrl: string
  ): Promise<Array<{ title: string; location: string; applyUrl: string; description: string }> | null> {
    try {
      const { jobContainer, title: titleSel, location: locationSel, applyLink } = record.selectors;

      const jobs = await page.evaluate(
        ({ jobContainer, titleSel, locationSel, applyLink, baseUrl }) => {
          const containers = Array.from(document.querySelectorAll(jobContainer));
          if (!containers.length) return null;

          return containers.map((el) => {
            const titleEl = el.querySelector(titleSel);
            const locationEl = el.querySelector(locationSel);
            const linkEl = el.querySelector(applyLink) as HTMLAnchorElement | null;

            const rawHref = linkEl?.href ?? '';
            let applyUrl = rawHref;
            try {
              if (rawHref && !rawHref.startsWith('http')) {
                applyUrl = new URL(rawHref, baseUrl).href;
              }
            } catch {}

            return {
              title: titleEl?.textContent?.trim() ?? '',
              location: locationEl?.textContent?.trim() ?? 'Remote',
              applyUrl,
              description: el.textContent?.slice(0, 300)?.trim() ?? '',
            };
          }).filter((j) => j.title && j.applyUrl);
        },
        { jobContainer, titleSel, locationSel, applyLink, baseUrl }
      );

      if (!jobs || jobs.length === 0) {
        logger.debug({ domain: record.domain, jobContainer }, 'Stored selectors returned no jobs');
        return null;
      }

      logger.info({ domain: record.domain, count: jobs.length, confidence: record.confidenceScore }, 'Scraper memory hit — skipped GPT');
      return jobs;
    } catch (err) {
      logger.debug({ err, domain: record.domain }, 'Stored selectors failed — falling back to GPT');
      return null;
    }
  }

  /**
   * Probe well-known job listing patterns against the loaded page.
   * Returns the first pattern that produces results, or null.
   */
  async probeCommonPatterns(
    page: Page,
    baseUrl: string
  ): Promise<{ jobs: Array<{ title: string; location: string; applyUrl: string; description: string }>; selectors: StoredSelectors } | null> {
    for (const pattern of COMMON_JOB_SELECTORS) {
      try {
        const result = await page.evaluate(
          ({ jobContainer, titleSel, locationSel, applyLink, baseUrl }) => {
            const containers = Array.from(document.querySelectorAll(jobContainer));
            if (!containers.length) return null;

            const jobs = containers.map((el) => {
              const titleEl = el.querySelector(titleSel);
              const locationEl = el.querySelector(locationSel);
              const linkEl = el.querySelector(applyLink) as HTMLAnchorElement | null;
              let applyUrl = linkEl?.href ?? '';
              try {
                if (applyUrl && !applyUrl.startsWith('http')) applyUrl = new URL(applyUrl, baseUrl).href;
              } catch {}
              return {
                title: titleEl?.textContent?.trim() ?? '',
                location: locationEl?.textContent?.trim() ?? 'Remote',
                applyUrl,
                description: el.textContent?.slice(0, 300)?.trim() ?? '',
              };
            }).filter((j) => j.title && j.applyUrl);

            return jobs.length >= 1 ? jobs : null;
          },
          { jobContainer: pattern.jobContainer, titleSel: pattern.title, locationSel: pattern.location, applyLink: pattern.applyLink, baseUrl }
        );

        if (result) {
          logger.info({ jobContainer: pattern.jobContainer, count: result.length }, 'Common pattern match — no GPT needed');
          return {
            jobs: result,
            selectors: { ...pattern },
          };
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Save or update a successful extraction strategy.
   * Called after any successful scrape (selector-based or AI-based).
   */
  async record(
    domain: string,
    domHash: string,
    selectors: StoredSelectors,
    extractionStrategy: 'selector' | 'ai',
    atsType?: string
  ): Promise<void> {
    try {
      const existing = await db
        .select({ id: scraperMemory.id, successCount: scraperMemory.successCount, attemptCount: scraperMemory.attemptCount })
        .from(scraperMemory)
        .where(and(eq(scraperMemory.domain, domain), eq(scraperMemory.domHash, domHash)))
        .limit(1);

      if (existing.length > 0) {
        const row = existing[0];
        const newSuccess = row.successCount + 1;
        const newAttempt = row.attemptCount + 1;
        const newConfidence = Math.min(newSuccess / newAttempt, 1);

        await db
          .update(scraperMemory)
          .set({
            selectorsJson: selectors,
            extractionStrategy,
            confidenceScore: newConfidence,
            successCount: newSuccess,
            attemptCount: newAttempt,
            lastVerifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(scraperMemory.id, row.id));
      } else {
        await db.insert(scraperMemory).values({
          domain,
          atsType: atsType ?? null,
          domHash,
          selectorsJson: selectors,
          extractionStrategy,
          confidenceScore: 0.5, // Start at 50% confidence after first success
          successCount: 1,
          attemptCount: 1,
          lastVerifiedAt: new Date(),
        });
      }
    } catch (err) {
      logger.debug({ err, domain }, 'Failed to save scraper memory — non-critical');
    }
  }

  /**
   * Record a failed attempt (decreases confidence score).
   */
  async recordFailure(domain: string, domHash: string): Promise<void> {
    try {
      const existing = await db
        .select({ id: scraperMemory.id, successCount: scraperMemory.successCount, attemptCount: scraperMemory.attemptCount })
        .from(scraperMemory)
        .where(and(eq(scraperMemory.domain, domain), eq(scraperMemory.domHash, domHash)))
        .limit(1);

      if (existing.length > 0) {
        const row = existing[0];
        const newAttempt = row.attemptCount + 1;
        await db
          .update(scraperMemory)
          .set({
            confidenceScore: row.successCount / newAttempt,
            attemptCount: newAttempt,
            updatedAt: new Date(),
          })
          .where(eq(scraperMemory.id, row.id));
      }
    } catch {
      // Non-critical
    }
  }
}

export const scraperMemoryService = new ScraperMemoryService();
