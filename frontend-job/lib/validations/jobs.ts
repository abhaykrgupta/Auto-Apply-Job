import { z } from 'zod';

export const jobSearchParamsSchema = z.object({
  query: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  remote: z.union([z.string(), z.boolean()]).optional(),
  sources: z.array(z.string()).optional(),
  boardUrls: z.array(z.string()).optional(),
  limit: z.coerce.number().optional(),
  datePosted: z.string().optional(),
}).strip();

export const singleApplyBodySchema = z.object({
  resumeId: z.string().uuid().optional(),
}).strip();

export const batchApplyBodySchema = z.object({
  jobIds: z.array(z.string().uuid()).min(1).max(50),
  resumeId: z.string().uuid().optional(),
}).strip();

export const bulkApplyBodySchema = z.object({
  resumeId: z.string().uuid(),
  minMatchScore: z.number().optional(),
}).strip();

export const scrapeJobsSchema = z.object({
  sources: z.array(z.string()).optional(),
  query: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  remote: z.union([z.string(), z.boolean()]).optional(),
  datePosted: z.string().optional(),
  boardUrls: z.array(z.string()).optional(),
  limit: z.number().optional(),
}).strip();

export const saveExternalJobSchema = z.object({
  job: z.any(), // Since job is a complex object, we'll keep it simple for now or use z.record
}).strip();

export const quickMatchSchema = z.any(); // Or a specific schema
export const matchResumeSchema = z.object({
  resumeId: z.string().uuid()
}).strip();

