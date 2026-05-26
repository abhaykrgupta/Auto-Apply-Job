ALTER TABLE "job_matches" ADD COLUMN "scored_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "job_matches" ADD COLUMN "feedback_signal" text;--> statement-breakpoint
CREATE UNIQUE INDEX "job_matches_job_resume_uidx" ON "job_matches" USING btree ("job_id","resume_id");--> statement-breakpoint
CREATE INDEX "job_matches_resume_score_idx" ON "job_matches" USING btree ("resume_id","score");--> statement-breakpoint
CREATE INDEX "job_matches_scored_at_idx" ON "job_matches" USING btree ("scored_at");