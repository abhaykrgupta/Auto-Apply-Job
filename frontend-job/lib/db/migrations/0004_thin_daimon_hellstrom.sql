CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_resume_id_idx" ON "applications" USING btree ("resume_id");--> statement-breakpoint
CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "jobs_company_id_idx" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_posted_at_idx" ON "jobs" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "jobs_source_idx" ON "jobs" USING btree ("source");