import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

/**
 * Returns companies from Nasscom's startup ecosystem.
 * Nasscom's 10000 Startups programme — India's largest startup incubator.
 * Uses fetch-first approach against their public directory API.
 * Falls back to a well-curated list of Nasscom-certified tech companies.
 */
export async function scrapeNasscom(): Promise<DiscoveredCompany[]> {
  logger.info('Fetching Nasscom India tech companies...');
  const results: DiscoveredCompany[] = [];

  // Try Nasscom's public startups page
  try {
    const res = await fetch('https://10000startups.com/startups', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAgentBot/1.0)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (res.ok) {
      const html = await res.text();
      // Extract startup names from title/h2/h3 tags
      const matches = html.match(/<(?:h[1-6]|strong)[^>]*>([A-Z][A-Za-z0-9\s&\.\-]{1,50})<\/(?:h[1-6]|strong)>/g) ?? [];
      for (const match of matches) {
        const name = match.replace(/<[^>]+>/g, '').trim();
        if (name.length >= 2 && name.length <= 60) {
          results.push({
            name,
            location: 'India',
            source: 'nasscom',
            tags: ['india', 'nasscom', 'startup'],
          });
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Nasscom 10000startups fetch failed, using curated list');
  }

  // Curated list of Nasscom-featured companies with known hiring boards
  const curated: DiscoveredCompany[] = [
    // Enterprise / IT Services
    { name: 'Mphasis', website: 'https://mphasis.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'it-services', 'nasscom'] },
    { name: 'Persistent Systems', website: 'https://persistent.com', location: 'Pune, India', source: 'nasscom', tags: ['india', 'it-services', 'nasscom'] },
    { name: 'Hexaware', website: 'https://hexaware.com', location: 'Mumbai, India', source: 'nasscom', tags: ['india', 'it-services', 'nasscom'] },
    { name: 'Mastech Digital', website: 'https://mastechdigital.com', location: 'India', source: 'nasscom', tags: ['india', 'it-services'] },
    { name: 'NIIT Technologies', website: 'https://niit-tech.com', location: 'Delhi, India', source: 'nasscom', tags: ['india', 'it-services'] },
    { name: 'Sonata Software', website: 'https://sonata-software.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'it-services'] },
    { name: 'Zensar Technologies', website: 'https://zensar.com', location: 'Pune, India', source: 'nasscom', tags: ['india', 'it-services'] },
    { name: 'Cyient', website: 'https://cyient.com', location: 'Hyderabad, India', source: 'nasscom', tags: ['india', 'it-services', 'engineering'] },
    { name: 'Infoedge', website: 'https://infoedge.in', location: 'Delhi, India', source: 'nasscom', tags: ['india', 'internet', 'nasscom'] },
    { name: 'Just Dial', website: 'https://justdial.com', location: 'Mumbai, India', source: 'nasscom', tags: ['india', 'internet'] },
    // Product companies
    { name: 'MoEngage', website: 'https://moengage.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'saas', 'martech'] },
    { name: 'WebEngage', website: 'https://webengage.com', location: 'Mumbai, India', source: 'nasscom', tags: ['india', 'saas', 'martech'] },
    { name: 'Exotel', website: 'https://exotel.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'saas', 'communications'] },
    { name: 'Ozonetel', website: 'https://ozonetel.com', location: 'Hyderabad, India', source: 'nasscom', tags: ['india', 'saas', 'communications'] },
    { name: 'Kapture CRM', website: 'https://kapturecrm.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'saas', 'crm'] },
    { name: 'Leadsquared', website: 'https://leadsquared.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'saas', 'crm'] },
    { name: 'Wingify', website: 'https://wingify.com', location: 'Delhi, India', source: 'nasscom', tags: ['india', 'saas', 'ab-testing'] },
    { name: 'Kovai.co', website: 'https://kovai.co', location: 'Coimbatore, India', source: 'nasscom', tags: ['india', 'saas'] },
    { name: 'Sprinklr', website: 'https://sprinklr.com', location: 'India office', source: 'nasscom', tags: ['india', 'saas', 'enterprise'] },
    { name: 'Druva', website: 'https://druva.com', location: 'Pune, India', source: 'nasscom', tags: ['india', 'saas', 'cloud', 'security'] },
    { name: 'Icertis', website: 'https://icertis.com', location: 'Pune, India', source: 'nasscom', tags: ['india', 'saas', 'contracts'] },
    // Mindtickle — Lever slug confirmed working (returns 31 jobs)
    { name: 'Mindtickle', website: 'https://mindtickle.com', atsUrl: 'https://jobs.lever.co/mindtickle', atsType: 'lever', location: 'Pune, India', source: 'nasscom', tags: ['india', 'saas', 'enablement'] },
    { name: 'Whatfix', website: 'https://whatfix.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'saas', 'dap'] },
    { name: 'Locus.sh', website: 'https://locus.sh', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'saas', 'logistics'] },
    { name: 'GreytHR', website: 'https://greythr.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'saas', 'hrtech'] },
    { name: 'Keka HR', website: 'https://keka.com', location: 'Hyderabad, India', source: 'nasscom', tags: ['india', 'saas', 'hrtech'] },
    { name: 'Zimyo', website: 'https://zimyo.com', location: 'Delhi, India', source: 'nasscom', tags: ['india', 'saas', 'hrtech'] },
    { name: 'HROne', website: 'https://hrone.cloud', location: 'Delhi, India', source: 'nasscom', tags: ['india', 'saas', 'hrtech'] },
    { name: 'PocketFM', website: 'https://pocketfm.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'media', 'audio'] },
    { name: 'ShareChat', website: 'https://sharechat.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'social', 'media'], fundingStage: 'series-e' },
    { name: 'Dailyhunt', website: 'https://dailyhunt.in', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'media', 'news'] },
    { name: 'Lokal', website: 'https://lokal.mobi', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'media', 'regional'] },
    { name: 'Vernacular.ai', website: 'https://vernacular.ai', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'ai', 'voicetech'] },
    { name: 'Detect Technologies', website: 'https://detect-technologies.com', location: 'Chennai, India', source: 'nasscom', tags: ['india', 'deeptech', 'iot'] },
    { name: 'Saama Technologies', website: 'https://saama.com', location: 'India', source: 'nasscom', tags: ['india', 'ai', 'pharma'] },
    { name: 'Hiver', website: 'https://hiverhq.com', location: 'Bangalore, India', source: 'nasscom', tags: ['india', 'saas', 'customer-support'] },
    { name: 'Freshteam', website: 'https://freshteam.com', location: 'Chennai, India', source: 'nasscom', tags: ['india', 'saas', 'hrtech'] },
    { name: 'Kissflow', website: 'https://kissflow.com', location: 'Chennai, India', source: 'nasscom', tags: ['india', 'saas', 'workflow'] },
    { name: 'Zoho Cliq', website: 'https://zoho.com', location: 'Chennai, India', source: 'nasscom', tags: ['india', 'saas', 'productivity'] },
    { name: 'Ramco Systems', website: 'https://ramco.com', location: 'Chennai, India', source: 'nasscom', tags: ['india', 'erp', 'enterprise'] },
    { name: 'Tata Consultancy Services', website: 'https://tcs.com', location: 'Mumbai, India', source: 'nasscom', tags: ['india', 'it-services', 'nasscom'] },
    { name: 'Tech Mahindra', website: 'https://techmahindra.com', location: 'Pune, India', source: 'nasscom', tags: ['india', 'it-services', 'nasscom'] },
  ];

  results.push(...curated);
  logger.info(`Nasscom: total ${results.length} India tech companies`);
  return results;
}
