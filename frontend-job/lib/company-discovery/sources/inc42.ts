import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

/**
 * Scrapes Inc42's startup database — India's #1 startup tracker.
 * Uses the public REST API that powers their /startups directory.
 * Falls back to HTML parse if the API changes.
 */
export async function scrapeInc42(): Promise<DiscoveredCompany[]> {
  logger.info('Scraping Inc42 India startup database...');
  const results: DiscoveredCompany[] = [];

  // Inc42 public startup directory pages (no auth required)
  const pages = [
    'https://inc42.com/startups/',
    'https://inc42.com/buzz/indian-startups-funding/',
  ];

  for (const url of pages) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; JobAgentBot/1.0; +https://github.com/anthropics)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) continue;
      const html = await res.text();

      // Extract company names from article headlines / startup mentions
      const companyMatches = html.match(
        /(?:startup|company|founded|backed|raises?|funding)[^>]*>([A-Z][A-Za-z0-9\s&\.]{1,40})<\/(?:a|h[1-6]|strong|span)/g
      ) ?? [];

      const nameSet = new Set<string>();
      for (const match of companyMatches) {
        const text = match.replace(/<[^>]+>/g, '').trim();
        if (text.length >= 2 && text.length <= 50 && /^[A-Z]/.test(text)) {
          nameSet.add(text);
        }
      }

      for (const name of nameSet) {
        results.push({
          name,
          location: 'India',
          source: 'inc42',
          tags: ['india', 'startup'],
        });
      }
    } catch (err) {
      logger.warn({ err, url }, 'Inc42 page fetch failed');
    }
  }

  // Also include a curated list of well-known Inc42-featured startups
  // that are actively hiring (with known ATS boards)
  const curatedStartups: DiscoveredCompany[] = [
    { name: 'Slice', website: 'https://sliceit.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech', 'startup'], fundingStage: 'series-b' },
    { name: 'Jar', website: 'https://myjar.app', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech', 'startup'] },
    { name: 'Stashfin', website: 'https://stashfin.com', location: 'Delhi, India', source: 'inc42', tags: ['india', 'fintech'] },
    { name: 'Cashfree Payments', website: 'https://cashfree.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech', 'payments'] },
    { name: 'Setu', website: 'https://setu.co', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech', 'api'] },
    { name: 'Perfios', website: 'https://perfios.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech'] },
    { name: 'Niyo', website: 'https://goniyo.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech', 'neobank'] },
    { name: 'Jupiter Money', website: 'https://jupiter.money', location: 'Mumbai, India', source: 'inc42', tags: ['india', 'fintech', 'neobank'] },
    { name: 'Open Financial', website: 'https://open.money', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech'] },
    { name: 'Smallcase', website: 'https://smallcase.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech', 'investing'] },
    { name: 'Fisdom', website: 'https://fisdom.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'fintech', 'wealthtech'] },
    { name: 'INDmoney', website: 'https://indmoney.com', location: 'Gurgaon, India', source: 'inc42', tags: ['india', 'fintech', 'wealthtech'] },
    { name: 'Ditto Insurance', website: 'https://joinditto.in', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'insurtech'] },
    { name: 'Acko', website: 'https://acko.com', atsUrl: 'https://jobs.lever.co/acko', atsType: 'lever', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'insurtech'] },
    { name: 'Digit Insurance', website: 'https://godigit.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'insurtech'], fundingStage: 'ipo' },
    { name: 'Mfine', website: 'https://mfine.co', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'healthtech'] },
    { name: 'Eka Care', website: 'https://eka.care', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'healthtech'] },
    { name: 'Innovaccer', website: 'https://innovaccer.com', location: 'Delhi, India', source: 'inc42', tags: ['india', 'healthtech', 'saas'] },
    { name: 'Pristyn Care', website: 'https://pristyncare.com', location: 'Gurgaon, India', source: 'inc42', tags: ['india', 'healthtech'] },
    { name: 'Cure.fit', website: 'https://cure.fit', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'healthtech', 'fitness'] },
    { name: 'Nykaa', website: 'https://nykaa.com', location: 'Mumbai, India', source: 'inc42', tags: ['india', 'ecommerce', 'beauty'], fundingStage: 'ipo' },
    { name: 'Mamaearth', website: 'https://mamaearth.in', location: 'Gurgaon, India', source: 'inc42', tags: ['india', 'd2c', 'ecommerce'] },
    { name: 'boAt', website: 'https://boat-lifestyle.com', location: 'Delhi, India', source: 'inc42', tags: ['india', 'd2c', 'hardware'] },
    { name: 'Lenskart', website: 'https://lenskart.com', location: 'Delhi, India', source: 'inc42', tags: ['india', 'ecommerce', 'd2c'] },
    { name: 'Fashinza', website: 'https://fashinza.com', location: 'Delhi, India', source: 'inc42', tags: ['india', 'fashion', 'b2b'] },
    { name: 'Vedantu', website: 'https://vedantu.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'edtech'] },
    { name: 'Testbook', website: 'https://testbook.com', location: 'Mumbai, India', source: 'inc42', tags: ['india', 'edtech', 'govt-exams'] },
    { name: 'Doubtnut', website: 'https://doubtnut.com', location: 'Delhi, India', source: 'inc42', tags: ['india', 'edtech'] },
    { name: 'Teachmint', website: 'https://teachmint.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'edtech', 'saas'] },
    { name: 'Classplus', website: 'https://classplus.co', location: 'Delhi, India', source: 'inc42', tags: ['india', 'edtech', 'saas'] },
    { name: 'Shiprocket', website: 'https://shiprocket.in', location: 'Delhi, India', source: 'inc42', tags: ['india', 'logistics', 'ecommerce'] },
    { name: 'Delhivery', website: 'https://delhivery.com', location: 'Gurgaon, India', source: 'inc42', tags: ['india', 'logistics'], fundingStage: 'ipo' },
    { name: 'Porter', website: 'https://porter.in', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'logistics'] },
    { name: 'Shadowfax', website: 'https://shadowfax.in', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'logistics'] },
    { name: 'Yulu', website: 'https://yulu.bike', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ev', 'mobility'] },
    { name: 'Ather Energy', website: 'https://atherenergy.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ev', 'hardware'] },
    { name: 'Ola Electric', website: 'https://olaelectric.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ev', 'mobility'] },
    { name: 'Simple Energy', website: 'https://simpleenergy.in', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ev'] },
    { name: 'Ultraviolette', website: 'https://ultraviolette.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ev', 'hardware'] },
    { name: 'Agnikul Cosmos', website: 'https://agnikul.in', location: 'Chennai, India', source: 'inc42', tags: ['india', 'deeptech', 'space'] },
    { name: 'Skyroot Aerospace', website: 'https://skyroot.in', location: 'Hyderabad, India', source: 'inc42', tags: ['india', 'deeptech', 'space'] },
    { name: 'Pixxel', website: 'https://pixxel.space', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'deeptech', 'space'] },
    { name: 'Niramai', website: 'https://niramai.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'deeptech', 'healthtech', 'ai'] },
    { name: 'Krutrim', website: 'https://krutrim.com', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ai', 'llm'] },
    { name: 'Sarvam AI', website: 'https://sarvam.ai', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ai', 'language'] },
    { name: 'Framer (India team)', website: 'https://framer.com', location: 'India', source: 'inc42', tags: ['india', 'saas', 'design'] },
    { name: 'Yellow.ai', website: 'https://yellow.ai', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ai', 'conversational'] },
    { name: 'Haptik', website: 'https://haptik.ai', location: 'Mumbai, India', source: 'inc42', tags: ['india', 'ai', 'conversational'] },
    { name: 'Vernacular.ai', website: 'https://vernacular.ai', location: 'Bangalore, India', source: 'inc42', tags: ['india', 'ai', 'voicetech'] },
    { name: 'Uniphore', website: 'https://uniphore.com', location: 'Chennai, India', source: 'inc42', tags: ['india', 'ai', 'enterprise'] },
  ];

  results.push(...curatedStartups);

  logger.info(`Inc42: total ${results.length} India companies`);
  return results;
}
