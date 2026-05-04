import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  console.log('Adding label column to resumes...');
  await sql`ALTER TABLE resumes ADD COLUMN IF NOT EXISTS label TEXT`;
  console.log('Done!');
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
