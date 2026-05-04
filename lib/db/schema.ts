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
} from 'drizzle-orm/pg-core';

export const jobStatusEnum = pgEnum('job_status', ['active', 'expired', 'filled']);
export const applicationStatusEnum = pgEnum('application_status', [
  'pending', 'applied', 'failed', 'manual_review', 'interviewing', 'rejected', 'accepted',
]);
export const jobSourceEnum = pgEnum('job_source', [
  'greenhouse', 'lever', 'workday', 'ashby', 'linkedin', 'indeed', 'custom',
]);

export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  linkedin: text('linkedin'),
  github: text('github'),
  portfolio: text('portfolio'),
  preferredRoles: text('preferred_roles').array(),
  preferredLocations: text('preferred_locations').array(),
  remotePreference: text('remote_preference'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profile.id).notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileUrl: text('file_url'),
  parsedData: jsonb('parsed_data'),
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
  postedAt: timestamp('posted_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

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
  createdAt: timestamp('created_at').defaultNow(),
});

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
  metadata: jsonb('metadata'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

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
