import { NextRequest, NextResponse } from 'next/server';
import { scrapeAndSaveJobs } from '@/lib/scrapers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support universal scraper if sources array is provided
    if (body.sources?.length) {
      const { UniversalScraper } = await import('@/lib/scrapers/universal-scraper');
      const scraper = new UniversalScraper();
      const result = await scraper.scrapeAllSources({
        query: body.query ?? body.role,
        location: body.location,
        remote: body.remote === 'remote' || body.remote === true,
        sources: body.sources,
        boardUrls: body.boardUrls,
        limit: body.limit ?? 50,
        datePosted: body.datePosted,
      });
      return NextResponse.json({ success: true, ...result });
    }

    // Default: Greenhouse + Lever board scraping
    const result = await scrapeAndSaveJobs({
      role: body.role,
      location: body.location,
      remote: body.remote,
      boardUrls: body.boardUrls,
      datePosted: body.datePosted,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scraping failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
