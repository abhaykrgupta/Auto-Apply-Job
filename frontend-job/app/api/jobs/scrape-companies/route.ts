import { NextRequest, NextResponse } from 'next/server';
import { UniversalCareerScraper } from '@/lib/scrapers/universal-career-scraper';
import { scrapeCompanyCareerPages } from '@/lib/scrapers';
import { db } from '@/lib/db';
import { profile } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const companyUrls: string[] = body.companyUrls;

    if (companyUrls && Array.isArray(companyUrls) && companyUrls.length > 0) {
      logger.info({ urls: companyUrls }, 'Manual scraping specific company URLs');
      const scraper = new UniversalCareerScraper();
      const allJobs = [];
      
      for (const url of companyUrls) {
        try {
          // Extract a generic name from URL domain
          const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
          const jobs = await scraper.scrape(domain, url);
          allJobs.push(...jobs);
        } catch (err) {
          logger.error({ err, url }, 'Failed to scrape specific company URL');
        }
      }
      
      return NextResponse.json({ success: true, jobs: allJobs });
    }

    // No body provided, trigger generic scrapeCompanyCareerPages
    const userProfile = await db.query.profile.findFirst({
      orderBy: [desc(profile.createdAt)],
    });

    const filters = {
      role: userProfile?.preferredRoles?.[0] || 'software engineer',
      location: userProfile?.preferredLocations?.[0] || undefined,
      remote: userProfile?.remotePreference || undefined,
    };

    logger.info({ filters }, 'Manual trigger for generic career page scraping');
    const summary = await scrapeCompanyCareerPages(filters, 50);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'Error in scrape-companies endpoint');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
