import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Missing DATABASE_URL in environment. Add it to .env.local:\n  DATABASE_URL=postgresql://...'
  );
}

const connectionString = process.env.DATABASE_URL;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false, ssl: 'require' });
export const db = drizzle(client, { schema });
