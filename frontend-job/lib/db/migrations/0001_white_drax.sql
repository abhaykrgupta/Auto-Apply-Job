CREATE TABLE "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_type" text NOT NULL,
	"model" text NOT NULL,
	"tokens_input" integer DEFAULT 0 NOT NULL,
	"tokens_output" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"cache_hit" boolean DEFAULT false NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"related_entity_id" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "auth_accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "auth_verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "company_response_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"company_name" text NOT NULL,
	"total_applications" integer DEFAULT 0 NOT NULL,
	"response_count" integer DEFAULT 0 NOT NULL,
	"response_rate" real DEFAULT 0 NOT NULL,
	"avg_response_days" real,
	"interview_count" integer DEFAULT 0 NOT NULL,
	"interview_rate" real DEFAULT 0 NOT NULL,
	"last_updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "embedding_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_hash" text NOT NULL,
	"model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"use_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp DEFAULT now(),
	CONSTRAINT "embedding_cache_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "keyword_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"occurrences" integer DEFAULT 0 NOT NULL,
	"response_count" integer DEFAULT 0 NOT NULL,
	"response_rate" real DEFAULT 0 NOT NULL,
	"avg_match_score" real DEFAULT 0 NOT NULL,
	"last_updated_at" timestamp DEFAULT now(),
	CONSTRAINT "keyword_performance_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
CREATE TABLE "resume_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_id" uuid NOT NULL,
	"total_applications" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"response_count" integer DEFAULT 0 NOT NULL,
	"interview_count" integer DEFAULT 0 NOT NULL,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"avg_match_score" real,
	"best_source" text,
	"best_job_title" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "resume_performance_resume_id_unique" UNIQUE("resume_id")
);
--> statement-breakpoint
CREATE TABLE "resume_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text DEFAULT 'Untitled Resume' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"template_id" text DEFAULT 'classic' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"deployed_resume_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scraper_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"ats_type" text,
	"dom_hash" text NOT NULL,
	"selectors_json" jsonb NOT NULL,
	"pagination_strategy" text,
	"extraction_strategy" text DEFAULT 'ai' NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_verified_at" timestamp DEFAULT now(),
	"parser_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "worker_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"worker_id" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "last_failure_type" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cooldown_until" timestamp;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_response_metrics" ADD CONSTRAINT "company_response_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_performance" ADD CONSTRAINT "resume_performance_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_projects" ADD CONSTRAINT "resume_projects_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_projects" ADD CONSTRAINT "resume_projects_deployed_resume_id_resumes_id_fk" FOREIGN KEY ("deployed_resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embedding_cache_hash_idx" ON "embedding_cache" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "keyword_perf_keyword_idx" ON "keyword_performance" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "scraper_memory_domain_idx" ON "scraper_memory" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "scraper_memory_dom_hash_idx" ON "scraper_memory" USING btree ("dom_hash");--> statement-breakpoint
CREATE INDEX "worker_tasks_status_idx" ON "worker_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worker_tasks_type_idx" ON "worker_tasks" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "worker_tasks_priority_idx" ON "worker_tasks" USING btree ("priority");--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;