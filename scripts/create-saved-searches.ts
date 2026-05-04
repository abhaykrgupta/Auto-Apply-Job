import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  console.log('Creating saved_searches table...');
  await sql`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      role TEXT,
      location TEXT,
      remote TEXT DEFAULT 'any',
      sources JSONB DEFAULT '[]'::jsonb,
      experience TEXT,
      date_posted TEXT DEFAULT 'all',
      board_urls JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('Done!');
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
