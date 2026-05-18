import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Missing DATABASE_URL in environment. Add it to .env.local:\n  DATABASE_URL=postgresql://...'
  );
}

// Singleton prevents Next.js hot-reload from spawning multiple pool instances
// that pile up stale connections and cause EADDRNOTAVAIL errors in dev.
declare global {
  // eslint-disable-next-line no-var
  var _pgClient: postgres.Sql | undefined;
}

const client =
  global._pgClient ??
  postgres(process.env.DATABASE_URL, {
    prepare: false, // required for Supabase Transaction pooler (port 6543)
    ssl: 'require',
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  global._pgClient = client;
}

export const db = drizzle(client, { schema });
