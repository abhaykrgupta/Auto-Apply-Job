import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

// 100+ known companies with correct ATS board URLs — instant coverage, zero browser scraping
export const KNOWN_TECH_COMPANIES: DiscoveredCompany[] = [

  // ─── Big Tech (custom ATS — not scrapable via public API) ───────────────────
  { name: 'Google',    website: 'https://google.com',    atsType: 'custom', atsUrl: 'https://careers.google.com',    source: 'seed', industry: 'Technology', employeeCount: '100000+' },
  { name: 'Meta',      website: 'https://meta.com',      atsType: 'custom', atsUrl: 'https://www.metacareers.com',   source: 'seed', industry: 'Technology', employeeCount: '50000+' },
  { name: 'Apple',     website: 'https://apple.com',     atsType: 'custom', atsUrl: 'https://jobs.apple.com',        source: 'seed', industry: 'Technology', employeeCount: '100000+' },
  { name: 'Amazon',    website: 'https://amazon.com',    atsType: 'custom', atsUrl: 'https://www.amazon.jobs',       source: 'seed', industry: 'Technology', employeeCount: '100000+' },
  { name: 'Microsoft', website: 'https://microsoft.com', atsType: 'custom', atsUrl: 'https://careers.microsoft.com', source: 'seed', industry: 'Technology', employeeCount: '100000+' },

  // ─── Workday companies — use myworkdayjobs.com CXS API ──────────────────────
  { name: 'Shopify',     website: 'https://shopify.com',     atsType: 'workday', atsUrl: 'https://shopify.wd5.myworkdayjobs.com/Shopify',                                   source: 'seed', industry: 'E-commerce',  fundingStage: 'public' },
  { name: 'Snowflake',   website: 'https://snowflake.com',   atsType: 'workday', atsUrl: 'https://snowflake.wd1.myworkdayjobs.com/Snowflake_External_Career_Site',           source: 'seed', industry: 'Data',        fundingStage: 'public' },
  { name: 'CrowdStrike', website: 'https://crowdstrike.com', atsType: 'workday', atsUrl: 'https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers',                    source: 'seed', industry: 'Security',    fundingStage: 'public' },
  { name: 'Workday',     website: 'https://workday.com',     atsType: 'workday', atsUrl: 'https://workday.wd5.myworkdayjobs.com/Workday',                                   source: 'seed', industry: 'HR Tech',     fundingStage: 'public' },
  { name: 'ServiceNow',  website: 'https://servicenow.com',  atsType: 'workday', atsUrl: 'https://servicenow.wd5.myworkdayjobs.com/External',                               source: 'seed', industry: 'Enterprise',  fundingStage: 'public' },
  { name: 'Palantir',    website: 'https://palantir.com',    atsType: 'workday', atsUrl: 'https://palantir.wd5.myworkdayjobs.com/Palantir',                                 source: 'seed', industry: 'Data',        fundingStage: 'public' },

  // ─── Greenhouse companies ────────────────────────────────────────────────────
  { name: 'Uber',         website: 'https://uber.com',         atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/uber',          source: 'seed', industry: 'Technology',     employeeCount: '30000+' },
  { name: 'Lyft',         website: 'https://lyft.com',         atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/lyft',          source: 'seed', industry: 'Technology' },
  { name: 'Spotify',      website: 'https://spotify.com',      atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/spotify',       source: 'seed', industry: 'Music Tech',    employeeCount: '10000+' },
  { name: 'Anthropic',    website: 'https://anthropic.com',    atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/anthropic',     source: 'seed', industry: 'AI',            fundingStage: 'series_e' },
  { name: 'OpenAI',       website: 'https://openai.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/openairesearch', source: 'seed', industry: 'AI',           fundingStage: 'late-stage' },
  { name: 'Together AI',  website: 'https://together.ai',      atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/togethercomputer', source: 'seed', industry: 'AI',         fundingStage: 'series_b' },
  { name: 'Perplexity AI',website: 'https://perplexity.ai',    atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/perplexityai',  source: 'seed', industry: 'AI',            fundingStage: 'series_b' },
  { name: 'Replit',       website: 'https://replit.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/replit',        source: 'seed', industry: 'DevTools',      fundingStage: 'series_b' },
  { name: 'Character AI', website: 'https://character.ai',     atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/characterai',   source: 'seed', industry: 'AI',            fundingStage: 'series_b' },
  { name: 'Cloudflare',   website: 'https://cloudflare.com',   atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/cloudflare',   source: 'seed', industry: 'Cloud',          fundingStage: 'public' },
  { name: 'Datadog',      website: 'https://datadoghq.com',    atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/datadoghq',    source: 'seed', industry: 'Monitoring',     fundingStage: 'public' },
  { name: 'Temporal',     website: 'https://temporal.io',      atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/temporal',     source: 'seed', industry: 'Infrastructure', fundingStage: 'series_b' },
  { name: 'Render',       website: 'https://render.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/render',       source: 'seed', industry: 'Cloud',          fundingStage: 'series_b' },
  { name: 'PlanetScale',  website: 'https://planetscale.com',  atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/planetscale',  source: 'seed', industry: 'Database',       fundingStage: 'series_c' },
  { name: 'Snyk',         website: 'https://snyk.io',          atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/snyk',         source: 'seed', industry: 'Security',       fundingStage: 'series_g' },
  { name: 'HashiCorp',    website: 'https://hashicorp.com',    atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/hashicorp',    source: 'seed', industry: 'DevOps',         fundingStage: 'acquired' },
  { name: 'Figma',        website: 'https://figma.com',        atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/figma',        source: 'seed', industry: 'Design',         fundingStage: 'acquired' },
  { name: 'Airtable',     website: 'https://airtable.com',     atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/airtable',    source: 'seed', industry: 'Productivity',   fundingStage: 'series_f' },
  { name: 'Loom',         website: 'https://loom.com',         atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/loom',         source: 'seed', industry: 'Communication', fundingStage: 'acquired' },
  { name: 'Coda',         website: 'https://coda.io',          atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/coda',         source: 'seed', industry: 'Productivity',   fundingStage: 'series_d' },
  { name: 'Stripe',       website: 'https://stripe.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/stripe',       source: 'seed', industry: 'FinTech',        fundingStage: 'late-stage' },
  { name: 'Ramp',         website: 'https://ramp.com',         atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/ramp',         source: 'seed', industry: 'FinTech',        fundingStage: 'series_d' },
  { name: 'Mercury',      website: 'https://mercury.com',      atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/mercury',      source: 'seed', industry: 'FinTech',        fundingStage: 'series_c' },
  { name: 'Coinbase',     website: 'https://coinbase.com',     atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/coinbase',     source: 'seed', industry: 'Crypto',         fundingStage: 'public' },
  { name: 'Databricks',   website: 'https://databricks.com',   atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/databricks',  source: 'seed', industry: 'Data',            fundingStage: 'series_i' },
  { name: 'dbt Labs',     website: 'https://getdbt.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/dbtlabsofficial', source: 'seed', industry: 'Data',       fundingStage: 'series_d' },
  { name: 'Faire',        website: 'https://faire.com',        atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/faire',        source: 'seed', industry: 'Marketplace',   fundingStage: 'series_h' },
  { name: '1Password',    website: 'https://1password.com',    atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/1password',    source: 'seed', industry: 'Security',       fundingStage: 'series_c' },

  // Global remote-first startups
  { name: 'Deel',         website: 'https://deel.com',         atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/deel',         source: 'seed', industry: 'HR Tech',        fundingStage: 'series_d' },
  { name: 'Remote',       website: 'https://remote.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/remotecom',    source: 'seed', industry: 'HR Tech',        fundingStage: 'series_c' },
  { name: 'GitLab',       website: 'https://gitlab.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/gitlab',       source: 'seed', industry: 'DevTools',       fundingStage: 'public' },
  { name: 'Automattic',   website: 'https://automattic.com',   atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/automattic',   source: 'seed', industry: 'CMS',            fundingStage: 'late-stage' },
  { name: 'Zapier',       website: 'https://zapier.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/zapier',       source: 'seed', industry: 'Automation',     fundingStage: 'series_b' },
  { name: 'Discord',      website: 'https://discord.com',      atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/discord',      source: 'seed', industry: 'Communication', fundingStage: 'series_h' },
  { name: 'Canva',        website: 'https://canva.com',        atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/canva',        source: 'seed', industry: 'Design',         fundingStage: 'late-stage' },
  { name: 'Intercom',     website: 'https://intercom.com',     atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/intercom',     source: 'seed', industry: 'Customer Success', fundingStage: 'series_d' },
  { name: 'Lattice',      website: 'https://lattice.com',      atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/lattice',      source: 'seed', industry: 'HR Tech',        fundingStage: 'series_f' },
  { name: 'Gusto',        website: 'https://gusto.com',        atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/gusto',        source: 'seed', industry: 'HR Tech',        fundingStage: 'series_e' },
  { name: 'Checkr',       website: 'https://checkr.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/checkr',       source: 'seed', industry: 'HR Tech',        fundingStage: 'series_e' },
  { name: 'Retool',       website: 'https://retool.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/retool',       source: 'seed', industry: 'DevTools',       fundingStage: 'series_c' },
  { name: 'Sourcegraph',  website: 'https://sourcegraph.com',  atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/sourcegraph',  source: 'seed', industry: 'DevTools',       fundingStage: 'series_d' },
  { name: 'PostHog',      website: 'https://posthog.com',      atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/posthog',      source: 'seed', industry: 'Analytics',      fundingStage: 'series_b' },
  { name: 'Pulumi',       website: 'https://pulumi.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/pulumi',       source: 'seed', industry: 'DevOps',         fundingStage: 'series_c' },
  { name: 'Chainalysis',  website: 'https://chainalysis.com',  atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/chainalysis',  source: 'seed', industry: 'Crypto',         fundingStage: 'series_f' },
  { name: 'Waymo',        website: 'https://waymo.com',        atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/waymo',        source: 'seed', industry: 'Autonomous',     fundingStage: 'late-stage' },
  { name: 'Aurora',       website: 'https://aurora.tech',      atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/aurora',       source: 'seed', industry: 'Autonomous',     fundingStage: 'public' },
  { name: 'Rivian',       website: 'https://rivian.com',       atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/rivian',       source: 'seed', industry: 'EV',             fundingStage: 'public' },
  { name: 'Monzo',        website: 'https://monzo.com',        atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/monzo',        source: 'seed', industry: 'FinTech',        fundingStage: 'series_i' },
  { name: 'Wise',         website: 'https://wise.com',         atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/wise',         source: 'seed', industry: 'FinTech',        fundingStage: 'public' },
  { name: 'Robinhood',    website: 'https://robinhood.com',    atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/robinhood',    source: 'seed', industry: 'FinTech',        fundingStage: 'public' },
  { name: 'DoorDash',     website: 'https://doordash.com',     atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/doordash',     source: 'seed', industry: 'Marketplace',   fundingStage: 'public' },
  { name: 'Instacart',    website: 'https://instacart.com',    atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/instacart',    source: 'seed', industry: 'Marketplace',   fundingStage: 'public' },
  { name: 'Wealthsimple', website: 'https://wealthsimple.com', atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/wealthsimple', source: 'seed', industry: 'FinTech',       fundingStage: 'series_d' },
  { name: 'Pagerduty',    website: 'https://pagerduty.com',    atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/pagerduty',    source: 'seed', industry: 'DevOps',         fundingStage: 'public' },
  { name: 'Stability AI', website: 'https://stability.ai',     atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/stability',    source: 'seed', industry: 'AI',            fundingStage: 'series_a' },
  { name: 'Twitch',       website: 'https://twitch.tv',        atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/twitch',       source: 'seed', industry: 'Gaming',         fundingStage: 'acquired' },
  { name: 'Braintree',    website: 'https://braintreepayments.com', atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/braintree', source: 'seed', industry: 'FinTech',    fundingStage: 'acquired' },
  { name: 'Figma',        website: 'https://figma.com',        atsType: 'greenhouse', atsUrl: 'https://boards.greenhouse.io/figma',        source: 'seed', industry: 'Design',         fundingStage: 'acquired' },

  // ─── Lever companies ────────────────────────────────────────────────────────
  { name: 'Netflix',         website: 'https://netflix.com',      atsType: 'lever', atsUrl: 'https://jobs.lever.co/netflix',       source: 'seed', industry: 'Technology',   employeeCount: '10000+' },
  { name: 'Mistral AI',      website: 'https://mistral.ai',       atsType: 'lever', atsUrl: 'https://jobs.lever.co/mistral',       source: 'seed', industry: 'AI',           fundingStage: 'series_b' },
  { name: 'Cohere',          website: 'https://cohere.com',       atsType: 'lever', atsUrl: 'https://jobs.lever.co/cohere',        source: 'seed', industry: 'AI',           fundingStage: 'series_c' },
  { name: 'Scale AI',        website: 'https://scale.com',        atsType: 'lever', atsUrl: 'https://jobs.lever.co/scaleai',       source: 'seed', industry: 'AI',           fundingStage: 'series_f' },
  { name: 'Weights & Biases',website: 'https://wandb.ai',         atsType: 'lever', atsUrl: 'https://jobs.lever.co/wandb',         source: 'seed', industry: 'AI',           fundingStage: 'series_c' },
  { name: 'Grafana Labs',    website: 'https://grafana.com',      atsType: 'lever', atsUrl: 'https://jobs.lever.co/grafana',       source: 'seed', industry: 'Monitoring',   fundingStage: 'series_d' },
  { name: 'Notion',          website: 'https://notion.so',        atsType: 'lever', atsUrl: 'https://jobs.lever.co/notion',        source: 'seed', industry: 'Productivity', fundingStage: 'series_c' },
  { name: 'Brex',            website: 'https://brex.com',         atsType: 'lever', atsUrl: 'https://jobs.lever.co/brex',          source: 'seed', industry: 'FinTech',      fundingStage: 'series_d' },
  { name: 'Plaid',           website: 'https://plaid.com',        atsType: 'lever', atsUrl: 'https://jobs.lever.co/plaid',         source: 'seed', industry: 'FinTech',      fundingStage: 'series_d' },
  { name: 'Rippling',        website: 'https://rippling.com',     atsType: 'lever', atsUrl: 'https://jobs.lever.co/rippling',      source: 'seed', industry: 'HR Tech',      fundingStage: 'series_g' },
  { name: 'Front',           website: 'https://front.com',        atsType: 'lever', atsUrl: 'https://jobs.lever.co/frontapp',      source: 'seed', industry: 'Communication', fundingStage: 'series_d' },
  { name: 'Webflow',         website: 'https://webflow.com',      atsType: 'lever', atsUrl: 'https://jobs.lever.co/webflow',       source: 'seed', industry: 'NoCode',       fundingStage: 'series_c' },
  { name: 'Kong',            website: 'https://konghq.com',       atsType: 'lever', atsUrl: 'https://jobs.lever.co/kong',          source: 'seed', industry: 'API',          fundingStage: 'series_e' },

  // ─── Ashby companies ────────────────────────────────────────────────────────
  { name: 'Vercel',      website: 'https://vercel.com',      atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/vercel',          source: 'seed', industry: 'DevTools',  fundingStage: 'series_d' },
  { name: 'Supabase',    website: 'https://supabase.com',    atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/supabase',        source: 'seed', industry: 'DevTools',  fundingStage: 'series_c' },
  { name: 'Linear',      website: 'https://linear.app',      atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/linear',          source: 'seed', industry: 'DevTools',  fundingStage: 'series_b' },
  { name: 'Cursor',      website: 'https://cursor.sh',       atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/anysphere',       source: 'seed', industry: 'AI DevTools', fundingStage: 'series_b' },
  { name: 'Clerk',       website: 'https://clerk.com',       atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/clerk',           source: 'seed', industry: 'Auth',      fundingStage: 'series_b' },
  { name: 'Resend',      website: 'https://resend.com',      atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/resend',          source: 'seed', industry: 'Email',     fundingStage: 'series_a' },
  { name: 'Neon',        website: 'https://neon.tech',       atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/neondatabase',    source: 'seed', industry: 'Database',  fundingStage: 'series_b' },
  { name: 'ElevenLabs',  website: 'https://elevenlabs.io',   atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/elevenlabs',      source: 'seed', industry: 'AI',        fundingStage: 'series_c' },
  { name: 'Groq',        website: 'https://groq.com',        atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/groq',            source: 'seed', industry: 'AI Infra',  fundingStage: 'series_d' },
  { name: 'Zed',         website: 'https://zed.dev',         atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/zed-industries',  source: 'seed', industry: 'DevTools',  fundingStage: 'series_a' },
  { name: 'Modal',       website: 'https://modal.com',       atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/modal',           source: 'seed', industry: 'Cloud',     fundingStage: 'series_b' },
  { name: 'Railway',     website: 'https://railway.app',     atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/railway',         source: 'seed', industry: 'DevTools',  fundingStage: 'series_a' },
  { name: 'Letta',       website: 'https://letta.com',       atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/letta',           source: 'seed', industry: 'AI',        fundingStage: 'series_a' },
  { name: 'Cal.com',     website: 'https://cal.com',         atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/cal.com',         source: 'seed', industry: 'Scheduling', fundingStage: 'series_a' },
  { name: 'Hugging Face',website: 'https://huggingface.co',  atsType: 'ashby', atsUrl: 'https://jobs.ashbyhq.com/huggingface',     source: 'seed', industry: 'AI',        fundingStage: 'series_d' },

  // ─── SmartRecruiters companies ───────────────────────────────────────────────
  { name: 'Twilio',   website: 'https://twilio.com',   atsType: 'smartrecruiters', atsUrl: 'https://careers.smartrecruiters.com/Twilio',   source: 'seed', industry: 'Communications', fundingStage: 'public' },
  { name: 'Zalando',  website: 'https://zalando.com',  atsType: 'smartrecruiters', atsUrl: 'https://careers.smartrecruiters.com/Zalando',  source: 'seed', industry: 'E-commerce',    fundingStage: 'public' },
  { name: 'Booking',  website: 'https://booking.com',  atsType: 'smartrecruiters', atsUrl: 'https://careers.smartrecruiters.com/Booking',  source: 'seed', industry: 'Travel',         fundingStage: 'public' },
  { name: 'Klarna',   website: 'https://klarna.com',   atsType: 'smartrecruiters', atsUrl: 'https://careers.smartrecruiters.com/Klarna',   source: 'seed', industry: 'FinTech',        fundingStage: 'public' },
  { name: 'IKEA',     website: 'https://ikea.com',     atsType: 'smartrecruiters', atsUrl: 'https://careers.smartrecruiters.com/IKEA',     source: 'seed', industry: 'Retail',         fundingStage: 'public' },
  { name: 'Adyen',    website: 'https://adyen.com',    atsType: 'smartrecruiters', atsUrl: 'https://careers.smartrecruiters.com/Adyen',    source: 'seed', industry: 'FinTech',        fundingStage: 'public' },
];

export function getKnownCompanies(): DiscoveredCompany[] {
  logger.info(`Loading ${KNOWN_TECH_COMPANIES.length} known tech companies`);
  return KNOWN_TECH_COMPANIES;
}
