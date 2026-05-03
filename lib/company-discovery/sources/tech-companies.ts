import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

// 50+ known tech companies with pre-detected ATS — instant coverage, zero scraping needed
export const KNOWN_TECH_COMPANIES: DiscoveredCompany[] = [
  // Big Tech
  { name: 'Google', website: 'https://google.com', atsType: 'custom', atsUrl: 'https://careers.google.com', source: 'seed', industry: 'Technology', employeeCount: '100000+' },
  { name: 'Meta', website: 'https://meta.com', atsType: 'custom', atsUrl: 'https://www.metacareers.com', source: 'seed', industry: 'Technology', employeeCount: '50000+' },
  { name: 'Apple', website: 'https://apple.com', atsType: 'custom', atsUrl: 'https://jobs.apple.com', source: 'seed', industry: 'Technology', employeeCount: '100000+' },
  { name: 'Amazon', website: 'https://amazon.com', atsType: 'custom', atsUrl: 'https://www.amazon.jobs', source: 'seed', industry: 'Technology', employeeCount: '100000+' },
  { name: 'Microsoft', website: 'https://microsoft.com', atsType: 'custom', atsUrl: 'https://careers.microsoft.com', source: 'seed', industry: 'Technology', employeeCount: '100000+' },
  { name: 'Netflix', website: 'https://netflix.com', atsType: 'lever', atsUrl: 'https://jobs.lever.co/netflix', source: 'seed', industry: 'Technology', employeeCount: '10000+' },
  { name: 'Uber', website: 'https://uber.com', atsType: 'greenhouse', atsUrl: 'https://www.uber.com/us/en/careers/', source: 'seed', industry: 'Technology', employeeCount: '30000+' },
  { name: 'Lyft', website: 'https://lyft.com', atsType: 'greenhouse', atsUrl: 'https://www.lyft.com/careers', source: 'seed', industry: 'Technology' },
  { name: 'Twitter / X', website: 'https://x.com', atsType: 'greenhouse', atsUrl: 'https://careers.x.com', source: 'seed', industry: 'Technology' },
  { name: 'Spotify', website: 'https://spotify.com', atsType: 'greenhouse', atsUrl: 'https://www.lifeatspotify.com', source: 'seed', industry: 'Music Tech', employeeCount: '10000+' },

  // AI Companies
  { name: 'Anthropic', website: 'https://anthropic.com', atsType: 'greenhouse', atsUrl: 'https://www.anthropic.com/careers', source: 'seed', industry: 'AI', fundingStage: 'series_e' },
  { name: 'OpenAI', website: 'https://openai.com', atsType: 'greenhouse', atsUrl: 'https://openai.com/careers', source: 'seed', industry: 'AI', fundingStage: 'late-stage' },
  { name: 'Mistral AI', website: 'https://mistral.ai', atsType: 'lever', atsUrl: 'https://jobs.lever.co/mistral', source: 'seed', industry: 'AI', fundingStage: 'series_b' },
  { name: 'Cohere', website: 'https://cohere.com', atsType: 'lever', atsUrl: 'https://jobs.lever.co/cohere', source: 'seed', industry: 'AI', fundingStage: 'series_c' },
  { name: 'Scale AI', website: 'https://scale.com', atsType: 'lever', atsUrl: 'https://scale.com/careers', source: 'seed', industry: 'AI', fundingStage: 'series_f' },
  { name: 'Weights & Biases', website: 'https://wandb.ai', atsType: 'lever', atsUrl: 'https://jobs.lever.co/wandb', source: 'seed', industry: 'AI', fundingStage: 'series_c' },
  { name: 'Hugging Face', website: 'https://huggingface.co', atsType: 'custom', atsUrl: 'https://apply.workable.com/hugging-face/', source: 'seed', industry: 'AI', fundingStage: 'series_d' },
  { name: 'Together AI', website: 'https://together.ai', atsType: 'greenhouse', atsUrl: 'https://together.ai/careers', source: 'seed', industry: 'AI', fundingStage: 'series_b' },
  { name: 'Perplexity AI', website: 'https://perplexity.ai', atsType: 'greenhouse', atsUrl: 'https://www.perplexity.ai/hub/careers', source: 'seed', industry: 'AI', fundingStage: 'series_b' },
  { name: 'Cursor', website: 'https://cursor.sh', atsType: 'ashby', atsUrl: 'https://www.cursor.com/careers', source: 'seed', industry: 'AI DevTools', fundingStage: 'series_b' },
  { name: 'Replit', website: 'https://replit.com', atsType: 'greenhouse', atsUrl: 'https://replit.com/careers', source: 'seed', industry: 'DevTools', fundingStage: 'series_b' },
  { name: 'Character AI', website: 'https://character.ai', atsType: 'greenhouse', atsUrl: 'https://careers.character.ai', source: 'seed', industry: 'AI', fundingStage: 'series_b' },

  // DevTools & Infrastructure
  { name: 'Vercel', website: 'https://vercel.com', atsType: 'ashby', atsUrl: 'https://vercel.com/careers', source: 'seed', industry: 'DevTools', fundingStage: 'series_d' },
  { name: 'Supabase', website: 'https://supabase.com', atsType: 'ashby', atsUrl: 'https://supabase.com/careers', source: 'seed', industry: 'DevTools', fundingStage: 'series_c' },
  { name: 'Cloudflare', website: 'https://cloudflare.com', atsType: 'greenhouse', atsUrl: 'https://www.cloudflare.com/careers/', source: 'seed', industry: 'Cloud', fundingStage: 'public' },
  { name: 'Datadog', website: 'https://datadoghq.com', atsType: 'greenhouse', atsUrl: 'https://www.datadoghq.com/careers/', source: 'seed', industry: 'Monitoring', fundingStage: 'public' },
  { name: 'Grafana Labs', website: 'https://grafana.com', atsType: 'lever', atsUrl: 'https://grafana.com/careers/', source: 'seed', industry: 'Monitoring', fundingStage: 'series_d' },
  { name: 'Temporal', website: 'https://temporal.io', atsType: 'greenhouse', atsUrl: 'https://temporal.io/careers', source: 'seed', industry: 'Infrastructure', fundingStage: 'series_b' },
  { name: 'Linear', website: 'https://linear.app', atsType: 'ashby', atsUrl: 'https://linear.app/careers', source: 'seed', industry: 'DevTools', fundingStage: 'series_b' },
  { name: 'Render', website: 'https://render.com', atsType: 'greenhouse', atsUrl: 'https://render.com/careers', source: 'seed', industry: 'Cloud', fundingStage: 'series_b' },
  { name: 'PlanetScale', website: 'https://planetscale.com', atsType: 'greenhouse', atsUrl: 'https://planetscale.com/careers', source: 'seed', industry: 'Database', fundingStage: 'series_c' },
  { name: 'Snyk', website: 'https://snyk.io', atsType: 'greenhouse', atsUrl: 'https://snyk.io/careers/', source: 'seed', industry: 'Security', fundingStage: 'series_g' },
  { name: 'HashiCorp', website: 'https://hashicorp.com', atsType: 'greenhouse', atsUrl: 'https://www.hashicorp.com/careers', source: 'seed', industry: 'DevOps', fundingStage: 'acquired' },
  { name: 'Clerk', website: 'https://clerk.com', atsType: 'ashby', atsUrl: 'https://clerk.com/careers', source: 'seed', industry: 'Auth', fundingStage: 'series_b' },
  { name: 'Resend', website: 'https://resend.com', atsType: 'ashby', atsUrl: 'https://resend.com/careers', source: 'seed', industry: 'Email', fundingStage: 'series_a' },
  { name: 'Neon', website: 'https://neon.tech', atsType: 'ashby', atsUrl: 'https://neon.tech/careers', source: 'seed', industry: 'Database', fundingStage: 'series_b' },

  // Productivity & Collaboration
  { name: 'Notion', website: 'https://notion.so', atsType: 'lever', atsUrl: 'https://www.notion.so/careers', source: 'seed', industry: 'Productivity', fundingStage: 'series_c' },
  { name: 'Figma', website: 'https://figma.com', atsType: 'greenhouse', atsUrl: 'https://www.figma.com/careers/', source: 'seed', industry: 'Design', fundingStage: 'acquired' },
  { name: 'Airtable', website: 'https://airtable.com', atsType: 'greenhouse', atsUrl: 'https://airtable.com/careers', source: 'seed', industry: 'Productivity', fundingStage: 'series_f' },
  { name: 'Loom', website: 'https://loom.com', atsType: 'greenhouse', atsUrl: 'https://www.loom.com/careers', source: 'seed', industry: 'Communication', fundingStage: 'acquired' },
  { name: 'Coda', website: 'https://coda.io', atsType: 'greenhouse', atsUrl: 'https://coda.io/jobs', source: 'seed', industry: 'Productivity', fundingStage: 'series_d' },

  // FinTech
  { name: 'Stripe', website: 'https://stripe.com', atsType: 'greenhouse', atsUrl: 'https://stripe.com/jobs', source: 'seed', industry: 'FinTech', fundingStage: 'late-stage' },
  { name: 'Brex', website: 'https://brex.com', atsType: 'lever', atsUrl: 'https://www.brex.com/careers', source: 'seed', industry: 'FinTech', fundingStage: 'series_d' },
  { name: 'Plaid', website: 'https://plaid.com', atsType: 'lever', atsUrl: 'https://plaid.com/careers/', source: 'seed', industry: 'FinTech', fundingStage: 'series_d' },
  { name: 'Ramp', website: 'https://ramp.com', atsType: 'greenhouse', atsUrl: 'https://ramp.com/careers', source: 'seed', industry: 'FinTech', fundingStage: 'series_d' },
  { name: 'Mercury', website: 'https://mercury.com', atsType: 'greenhouse', atsUrl: 'https://mercury.com/careers', source: 'seed', industry: 'FinTech', fundingStage: 'series_c' },
  { name: 'Rippling', website: 'https://rippling.com', atsType: 'lever', atsUrl: 'https://www.rippling.com/careers', source: 'seed', industry: 'HR Tech', fundingStage: 'series_g' },
  { name: 'Coinbase', website: 'https://coinbase.com', atsType: 'greenhouse', atsUrl: 'https://www.coinbase.com/careers', source: 'seed', industry: 'Crypto', fundingStage: 'public' },

  // Data
  { name: 'Databricks', website: 'https://databricks.com', atsType: 'greenhouse', atsUrl: 'https://www.databricks.com/company/careers', source: 'seed', industry: 'Data', fundingStage: 'series_i' },
  { name: 'Snowflake', website: 'https://snowflake.com', atsType: 'workday', atsUrl: 'https://careers.snowflake.com', source: 'seed', industry: 'Data', fundingStage: 'public' },
  { name: 'dbt Labs', website: 'https://getdbt.com', atsType: 'greenhouse', atsUrl: 'https://www.getdbt.com/dbt-labs/open-roles', source: 'seed', industry: 'Data', fundingStage: 'series_d' },

  // E-commerce
  { name: 'Shopify', website: 'https://shopify.com', atsType: 'workday', atsUrl: 'https://www.shopify.com/careers', source: 'seed', industry: 'E-commerce', fundingStage: 'public' },
  { name: 'Faire', website: 'https://faire.com', atsType: 'greenhouse', atsUrl: 'https://www.faire.com/careers', source: 'seed', industry: 'Marketplace', fundingStage: 'series_h' },

  // Security
  { name: 'CrowdStrike', website: 'https://crowdstrike.com', atsType: 'workday', atsUrl: 'https://www.crowdstrike.com/careers/', source: 'seed', industry: 'Security', fundingStage: 'public' },
  { name: '1Password', website: 'https://1password.com', atsType: 'greenhouse', atsUrl: 'https://1password.com/careers/', source: 'seed', industry: 'Security', fundingStage: 'series_c' },
];

export function getKnownCompanies(): DiscoveredCompany[] {
  logger.info(`Loading ${KNOWN_TECH_COMPANIES.length} known tech companies`);
  return KNOWN_TECH_COMPANIES;
}
