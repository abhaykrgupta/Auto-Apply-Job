import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
  pgEnum,
  index,
  uniqueIndex,
  customType,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]) {
    return JSON.stringify(value);
  },
  fromDriver(value: string) {
    return JSON.parse(value);
  },
});

// ── Auth Tables (Auth.js / NextAuth v5) ───────────────────────────────────────
export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  plan: text('plan').notNull().default('free'), // 'free' | 'pro' | 'enterprise'
  planExpiresAt: timestamp('plan_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const authAccounts = pgTable(
  'auth_accounts',
  {
    userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const authSessions = pgTable('auth_sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const authVerificationTokens = pgTable(
  'auth_verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

export const jobStatusEnum = pgEnum('job_status', ['active', 'expired', 'filled']);
export const applicationStatusEnum = pgEnum('application_status', [
  'pending', 'applied', 'failed', 'manual_review', 'interviewing', 'rejected', 'accepted',
]);
export const jobSourceEnum = pgEnum('job_source', [
  'greenhouse', 'lever', 'workday', 'ashby', 'linkedin', 'indeed', 'custom',
]);

export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  linkedin: text('linkedin'),
  github: text('github'),
  portfolio: text('portfolio'),
  bio: text('bio'),
  preferredRoles: text('preferred_roles').array(),
  preferredLocations: text('preferred_locations').array(),
  remotePreference: text('remote_preference'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('profile_user_id_idx').on(t.userId),
]);

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profile.id).notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileUrl: text('file_url'),
  parsedData: jsonb('parsed_data'),
  embedding: vector('embedding'),
  label: text('label'),
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    website: text('website'),
    careerPage: text('career_page'),
    atsType: text('ats_type'),
    atsUrl: text('ats_url'),
    description: text('description'),
    industry: text('industry'),
    employeeCount: text('employee_count'),
    location: text('location'),
    fundingStage: text('funding_stage'),
    logoUrl: text('logo_url'),
    tags: text('tags').array(),
    source: text('source').notNull(),
    // null = global (visible to all users); set = private to that user (manually added)
    addedByUserId: text('added_by_user_id').references(() => authUsers.id, { onDelete: 'cascade' }),
    discoveredAt: timestamp('discovered_at').defaultNow(),
    lastScrapedAt: timestamp('last_scraped_at'),
    activeJobsCount: integer('active_jobs_count').default(0),
    totalJobsFound: integer('total_jobs_found').default(0),
    isActive: boolean('is_active').default(true),
    scrapingEnabled: boolean('scraping_enabled').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    index('company_slug_idx').on(t.slug),
    index('company_ats_type_idx').on(t.atsType),
    index('company_source_idx').on(t.source),
  ]
);

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: text('external_id'),
  source: jobSourceEnum('source').notNull(),
  company: text('company').notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  companyLogo: text('company_logo'),
  title: text('title').notNull(),
  location: text('location'),
  locationType: text('location_type'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: text('salary_currency').default('USD'),
  description: text('description').notNull(),
  requirements: text('requirements'),
  benefits: text('benefits'),
  applyUrl: text('apply_url').notNull(),
  status: jobStatusEnum('status').default('active'),
  jobEmbedding: vector('job_embedding'),
  postedAt: timestamp('posted_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('jobs_company_id_idx').on(t.companyId),
  index('jobs_status_idx').on(t.status),
  index('jobs_posted_at_idx').on(t.postedAt),
  index('jobs_source_idx').on(t.source),
]);

export const jobMatches = pgTable('job_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  resumeId: uuid('resume_id').references(() => resumes.id).notNull(),
  score: real('score').notNull(),
  strengths: text('strengths').array(),
  weaknesses: text('weaknesses').array(),
  recommendation: text('recommendation'),
  confidence: real('confidence'),
  reasoning: text('reasoning'),
  // ── Cache: skip re-scoring if scored within 24h ──────────────────────────
  scoredAt: timestamp('scored_at').defaultNow(),
  // ── Feedback loop: did this application get a response? ──────────────────
  // 'positive' = got interview/offer, 'negative' = rejected, null = unknown
  feedbackSignal: text('feedback_signal'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  uniqueIndex('job_matches_job_resume_uidx').on(t.jobId, t.resumeId),
  index('job_matches_resume_score_idx').on(t.resumeId, t.score),
  index('job_matches_scored_at_idx').on(t.scoredAt),
]);

export const generatedContent = pgTable('generated_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  resumeId: uuid('resume_id').references(() => resumes.id).notNull(),
  contentType: text('content_type').notNull(),
  prompt: text('prompt'),
  content: text('content').notNull(),
  approved: boolean('approved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  resumeId: uuid('resume_id').references(() => resumes.id).notNull(),
  status: applicationStatusEnum('status').default('pending'),
  method: text('method'),
  attemptCount: integer('attempt_count').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  appliedAt: timestamp('applied_at'),
  screenshotPath: text('screenshot_path'),
  errorMessage: text('error_message'),
  // Retry intelligence columns
  lastFailureType: text('last_failure_type'),   // RetryClassifier.FailureType
  cooldownUntil: timestamp('cooldown_until'),    // Do not retry before this time
  metadata: jsonb('metadata'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  uniqueIndex('applications_job_resume_uidx').on(t.jobId, t.resumeId),
  index('applications_status_idx').on(t.status),
  index('applications_resume_id_idx').on(t.resumeId),
  index('applications_created_at_idx').on(t.createdAt),
]);

export const applicationLogs = pgTable('application_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  level: text('level').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const savedSearches = pgTable('saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: text('role'),
  location: text('location'),
  remote: text('remote').default('any'),
  sources: jsonb('sources').default([]),
  experience: text('experience'),
  datePosted: text('date_posted').default('all'),
  boardUrls: jsonb('board_urls').default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

export const resumeProjects = pgTable('resume_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profile.id).notNull(),
  name: text('name').notNull().default('Untitled Resume'),
  data: jsonb('data').notNull().default({}),
  templateId: text('template_id').notNull().default('classic'),
  status: text('status').notNull().default('draft'), // 'draft' | 'deployed'
  deployedResumeId: uuid('deployed_resume_id').references(() => resumes.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const companyDiscoverySources = pgTable('company_discovery_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: text('source').notNull(),           // 'yc' | 'github' | 'vc' | 'wellfound' | 'seed'
  runAt: timestamp('run_at').defaultNow(),
  status: text('status').notNull().default('pending'), // 'pending' | 'running' | 'done' | 'failed'
  discovered: integer('discovered').default(0),
  newCompanies: integer('new_companies').default(0),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms'),
  triggeredBy: text('triggered_by').default('manual'), // 'manual' | 'cron'
  createdAt: timestamp('created_at').defaultNow(),
});

// ── Scraper Memory ────────────────────────────────────────────────────────────
// Stores learned extraction strategies per domain so GPT is only a fallback
export const scraperMemory = pgTable(
  'scraper_memory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    domain: text('domain').notNull(),                     // e.g. "acme.com"
    atsType: text('ats_type'),                            // 'greenhouse' | 'lever' | 'workday' | 'custom'
    domHash: text('dom_hash').notNull(),                  // SHA-256 of structural DOM (no text)
    selectorsJson: jsonb('selectors_json').notNull(),     // { jobContainer, title, location, applyLink, pagination }
    paginationStrategy: text('pagination_strategy'),      // 'next-button' | 'load-more' | 'infinite-scroll' | 'none'
    extractionStrategy: text('extraction_strategy').notNull().default('ai'), // 'selector' | 'ai' | 'api'
    confidenceScore: real('confidence_score').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastVerifiedAt: timestamp('last_verified_at').defaultNow(),
    parserVersion: integer('parser_version').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    index('scraper_memory_domain_idx').on(t.domain),
    index('scraper_memory_dom_hash_idx').on(t.domHash),
  ]
);

// ── AI Usage Logs ─────────────────────────────────────────────────────────────
// Tracks every OpenAI API call for cost visibility and optimization
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  operationType: text('operation_type').notNull(), // 'resume_parse' | 'job_match' | 'tailoring' | 'cover_letter' | 'scrape_extract' | 'embedding' | 'form_detect'
  model: text('model').notNull(),
  tokensInput: integer('tokens_input').notNull().default(0),
  tokensOutput: integer('tokens_output').notNull().default(0),
  costUsd: real('cost_usd').notNull().default(0),
  latencyMs: integer('latency_ms').notNull().default(0),
  cacheHit: boolean('cache_hit').notNull().default(false),
  retryCount: integer('retry_count').notNull().default(0),
  relatedEntityId: text('related_entity_id'), // jobId | applicationId | resumeId
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── Embedding Cache ───────────────────────────────────────────────────────────
// Deduplicates embedding API calls — same text content = same vector
export const embeddingCache = pgTable(
  'embedding_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentHash: text('content_hash').notNull().unique(), // SHA-256 of normalized text
    model: text('model').notNull().default('text-embedding-3-small'),
    embedding: vector('embedding').notNull(),
    tokenCount: integer('token_count').notNull().default(0),
    useCount: integer('use_count').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow(),
    lastUsedAt: timestamp('last_used_at').defaultNow(),
  },
  (t) => [
    index('embedding_cache_hash_idx').on(t.contentHash),
  ]
);

// ── Worker Tasks ──────────────────────────────────────────────────────────────
// DB-backed task queue for isolated worker processes.
// Workers poll this table; Next.js APIs insert rows and return immediately.
export const workerTasks = pgTable(
  'worker_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskType: text('task_type').notNull(), // 'apply_job' | 'scrape_jobs' | 'scrape_company' | 'match_jobs' | 'tailor_resume'
    payload: jsonb('payload').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'running' | 'completed' | 'failed'
    workerId: text('worker_id'),           // identifies the worker process
    priority: integer('priority').notNull().default(0), // higher = processed first
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    result: jsonb('result'),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('worker_tasks_status_idx').on(t.status),
    index('worker_tasks_type_idx').on(t.taskType),
    index('worker_tasks_priority_idx').on(t.priority),
  ]
);

// ── Application Intelligence ──────────────────────────────────────────────────
// Tracks application outcomes for adaptive learning.

export const resumePerformance = pgTable('resume_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id).notNull().unique(),
  totalApplications: integer('total_applications').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),      // status = applied
  responseCount: integer('response_count').notNull().default(0),    // status = interviewing | accepted
  interviewCount: integer('interview_count').notNull().default(0),  // status = interviewing
  acceptedCount: integer('accepted_count').notNull().default(0),    // status = accepted
  avgMatchScore: real('avg_match_score'),
  bestSource: text('best_source'),          // which job board converts best
  bestJobTitle: text('best_job_title'),     // which role type converts best
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const keywordPerformance = pgTable(
  'keyword_performance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    keyword: text('keyword').notNull().unique(),
    occurrences: integer('occurrences').notNull().default(0),   // # applications containing keyword
    responseCount: integer('response_count').notNull().default(0),
    responseRate: real('response_rate').notNull().default(0),   // responseCount / occurrences
    avgMatchScore: real('avg_match_score').notNull().default(0),
    lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
  },
  (t) => [index('keyword_perf_keyword_idx').on(t.keyword)]
);

export const companyResponseMetrics = pgTable('company_response_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  companyName: text('company_name').notNull(),
  totalApplications: integer('total_applications').notNull().default(0),
  responseCount: integer('response_count').notNull().default(0),
  responseRate: real('response_rate').notNull().default(0),
  avgResponseDays: real('avg_response_days'),    // avg days from apply to response
  interviewCount: integer('interview_count').notNull().default(0),
  interviewRate: real('interview_rate').notNull().default(0),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
});

// ── Extension API tokens ──────────────────────────────────────────────────────
// One token per user. Used by the Chrome extension to auth without session cookies.

// ── Saved / Watchlisted Jobs ──────────────────────────────────────────────────
// Users can bookmark jobs to apply later or track interest.
export const savedJobs = pgTable(
  'saved_jobs',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    userId:    text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    jobId:     uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
    note:      text('note'),
    savedAt:   timestamp('saved_at').defaultNow(),
  },
  (t) => [
    index('saved_jobs_user_idx').on(t.userId),
    index('saved_jobs_job_idx').on(t.jobId),
  ]
);

// ── Job Alerts ────────────────────────────────────────────────────────────────
// Users create alerts and get notified (in-app badge + future email) when
// a new job with score >= threshold arrives.
export const jobAlerts = pgTable('job_alerts', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  name:         text('name').notNull(),            // e.g. "Senior React Engineer"
  role:         text('role'),
  location:     text('location'),
  remote:       boolean('remote').default(false),
  minScore:     integer('min_score').default(75),  // notify only when match >= this
  isActive:     boolean('is_active').default(true),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt:    timestamp('created_at').defaultNow(),
});

export const jobAlertMatches = pgTable('job_alert_matches', {
  id:        uuid('id').primaryKey().defaultRandom(),
  alertId:   uuid('alert_id').notNull().references(() => jobAlerts.id, { onDelete: 'cascade' }),
  jobId:     uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  score:     real('score').notNull(),
  seen:      boolean('seen').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const extensionTokens = pgTable('extension_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),  // null = never expires
});

// ── Extension application tracking ───────────────────────────────────────────
// Tracks applications submitted via the Co-Pilot extension.
// Separate from the main applications table (which requires a job_id FK).

export const extensionApplications = pgTable('extension_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  company: text('company').notNull(),
  role: text('role').notNull(),
  atsId: text('ats_id'),          // 'greenhouse' | 'lever' | 'workday' etc
  url: text('url'),
  status: text('status').default('in_progress'),  // 'in_progress' | 'submitted' | 'failed'
  fieldsCount: integer('fields_count').default(0),
  resumeVersion: text('resume_version'),
  appliedAt: timestamp('applied_at').defaultNow(),
  metadata: jsonb('metadata'),
});
