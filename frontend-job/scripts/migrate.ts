/**
 * Manual migration script — applies new tables directly via SQL.
 * Use this instead of `drizzle-kit push` when drizzle-kit crashes on
 * existing DB CHECK constraints (known drizzle-kit v0.31.x bug).
 *
 * Run:  npx tsx scripts/migrate.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

const migrations = [
  // ── Scraper Memory ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS scraper_memory (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain        TEXT NOT NULL,
    ats_type      TEXT,
    dom_hash      TEXT NOT NULL,
    selectors_json JSONB NOT NULL DEFAULT '{}',
    pagination_strategy TEXT,
    extraction_strategy TEXT NOT NULL DEFAULT 'ai',
    confidence_score REAL NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    parser_version INTEGER NOT NULL DEFAULT 1,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS scraper_memory_domain_idx ON scraper_memory (domain)`,
  `CREATE INDEX IF NOT EXISTS scraper_memory_dom_hash_idx ON scraper_memory (dom_hash)`,

  // ── AI Usage Logs ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type   TEXT NOT NULL,
    model            TEXT NOT NULL,
    tokens_input     INTEGER NOT NULL DEFAULT 0,
    tokens_output    INTEGER NOT NULL DEFAULT 0,
    cost_usd         REAL NOT NULL DEFAULT 0,
    latency_ms       INTEGER NOT NULL DEFAULT 0,
    cache_hit        BOOLEAN NOT NULL DEFAULT FALSE,
    retry_count      INTEGER NOT NULL DEFAULT 0,
    related_entity_id TEXT,
    success          BOOLEAN NOT NULL DEFAULT TRUE,
    error_message    TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Embedding Cache ───────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS embedding_cache (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT NOT NULL UNIQUE,
    model        TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    embedding    vector(1536) NOT NULL,
    token_count  INTEGER NOT NULL DEFAULT 0,
    use_count    INTEGER NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS embedding_cache_hash_idx ON embedding_cache (content_hash)`,

  // ── Worker Tasks ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS worker_tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type   TEXT NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'pending',
    worker_id   TEXT,
    priority    INTEGER NOT NULL DEFAULT 0,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    result      JSONB,
    error       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    started_at  TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS worker_tasks_status_idx   ON worker_tasks (status)`,
  `CREATE INDEX IF NOT EXISTS worker_tasks_type_idx     ON worker_tasks (task_type)`,
  `CREATE INDEX IF NOT EXISTS worker_tasks_priority_idx ON worker_tasks (priority DESC)`,

  // ── Applications: retry intelligence columns ──────────────────────────────
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_failure_type TEXT`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS cooldown_until    TIMESTAMPTZ`,

  // ── Resume Performance ────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS resume_performance (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id           UUID NOT NULL UNIQUE REFERENCES resumes(id),
    total_applications  INTEGER NOT NULL DEFAULT 0,
    success_count       INTEGER NOT NULL DEFAULT 0,
    response_count      INTEGER NOT NULL DEFAULT 0,
    interview_count     INTEGER NOT NULL DEFAULT 0,
    accepted_count      INTEGER NOT NULL DEFAULT 0,
    avg_match_score     REAL,
    best_source         TEXT,
    best_job_title      TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Keyword Performance ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS keyword_performance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword         TEXT NOT NULL UNIQUE,
    occurrences     INTEGER NOT NULL DEFAULT 0,
    response_count  INTEGER NOT NULL DEFAULT 0,
    response_rate   REAL NOT NULL DEFAULT 0,
    avg_match_score REAL NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS keyword_perf_keyword_idx ON keyword_performance (keyword)`,

  // ── Company Response Metrics ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS company_response_metrics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID REFERENCES companies(id),
    company_name        TEXT NOT NULL,
    total_applications  INTEGER NOT NULL DEFAULT 0,
    response_count      INTEGER NOT NULL DEFAULT 0,
    response_rate       REAL NOT NULL DEFAULT 0,
    avg_response_days   REAL,
    interview_count     INTEGER NOT NULL DEFAULT 0,
    interview_rate      REAL NOT NULL DEFAULT 0,
    last_updated_at     TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Auth Tables (Auth.js / NextAuth v5) ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS auth_users (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    email           TEXT NOT NULL UNIQUE,
    email_verified  TIMESTAMPTZ,
    image           TEXT,
    password        TEXT,
    plan            TEXT NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS auth_accounts (
    user_id              TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    type                 TEXT NOT NULL,
    provider             TEXT NOT NULL,
    provider_account_id  TEXT NOT NULL,
    refresh_token        TEXT,
    access_token         TEXT,
    expires_at           INTEGER,
    token_type           TEXT,
    scope                TEXT,
    id_token             TEXT,
    session_state        TEXT,
    PRIMARY KEY (provider, provider_account_id)
  )`,

  `CREATE TABLE IF NOT EXISTS auth_sessions (
    session_token TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    expires       TIMESTAMPTZ NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS auth_verification_tokens (
    identifier TEXT NOT NULL,
    token      TEXT NOT NULL,
    expires    TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
  )`,

  // ── Profile: add userId, avatarUrl, bio columns ───────────────────────────
  `ALTER TABLE profile ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE`,
  `ALTER TABLE profile ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
  `ALTER TABLE profile ADD COLUMN IF NOT EXISTS bio TEXT`,
];

async function run() {
  console.log('Running migrations…\n');
  for (const stmt of migrations) {
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 70);
    try {
      await sql.unsafe(stmt);
      console.log(`  ✓  ${preview}…`);
    } catch (err: any) {
      // Ignore "already exists" errors — idempotent
      if (err.message?.includes('already exists')) {
        console.log(`  –  (already exists) ${preview}…`);
      } else {
        console.error(`  ✗  FAILED: ${preview}\n     ${err.message}`);
        process.exit(1);
      }
    }
  }
  console.log('\nAll migrations applied.');
  await sql.end();
}

run();
