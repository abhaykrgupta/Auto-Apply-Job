import { scrapeJobsSchema } from '@/lib/validations/jobs';
import { NextRequest, NextResponse } from 'next/server';
import { scrapeAndSaveJobs } from '@/lib/scrapers';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit/simple-rate-limiter';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Max 5 scrape runs per hour — each run spawns many scrapers and can hit many external APIs
  if (!checkRateLimit(`scrape:${session.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limit: max 5 scrape runs per hour.' }, { status: 429 });
  }

  try {
    const parsed = scrapeJobsSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    // Support universal scraper if sources array is provided
    if (body.sources?.length) {
      const { UniversalScraper } = await import('@/lib/scrapers/universal-scraper');
      const scraper = new UniversalScraper();
      const result = await scraper.scrapeAllSources({
        query: body.query ?? body.role,
        location: body.location,
        remote: body.remote === 'remote' || body.remote === true,
        sources: body.sources as any[],
        boardUrls: body.boardUrls,
        limit: body.limit ?? 50,
        datePosted: body.datePosted,
        experience: body.experience,
      });
      return NextResponse.json({ success: true, ...result });
    }

    // Default: Greenhouse + Lever board scraping
    const result = await scrapeAndSaveJobs({
      role: body.role,
      location: body.location,
      remote: body.remote as any,
      boardUrls: body.boardUrls,
      datePosted: body.datePosted,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scraping failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
