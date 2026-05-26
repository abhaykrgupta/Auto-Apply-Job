import { z } from 'zod';

// Shared: safe URL must be https (blocks javascript:, data: etc)
const safeUrl = z.string().url().refine(
  (u) => u.startsWith('https://') || u.startsWith('http://localhost'),
  { message: 'URL must use https' }
);

// Short bounded text fields — prevent oversized injection payloads
const searchText = z.string().max(150).trim().optional();

export const jobSearchParamsSchema = z.object({
  query:      searchText,
  role:       searchText,
  location:   searchText,
  remote:     z.union([z.string(), z.boolean()]).optional(),
  sources:    z.array(z.string().max(50)).max(20).optional(),
  boardUrls:  z.array(safeUrl).max(20).optional(),
  limit:      z.coerce.number().min(1).max(200).optional(),
  datePosted: z.string().max(20).optional(),
}).strip();

export const singleApplyBodySchema = z.object({
  resumeId: z.string().uuid().optional(),
}).strip();

export const batchApplyBodySchema = z.object({
  jobIds:   z.array(z.string().uuid()).min(1).max(50),
  resumeId: z.string().uuid().optional(),
}).strip();

export const bulkApplyBodySchema = z.object({
  resumeId:      z.string().uuid(),
  minMatchScore: z.number().min(0).max(100).optional(),
}).strip();

export const scrapeJobsSchema = z.object({
  sources:    z.array(z.string().max(50)).max(20).optional(),
  query:      searchText,
  role:       searchText,
  location:   searchText,
  remote:     z.union([z.string(), z.boolean()]).optional(),
  datePosted: z.string().max(20).optional(),
  boardUrls:  z.array(safeUrl).max(20).optional(),
  limit:      z.number().min(1).max(200).optional(),
  experience: z.enum(['any', 'fresher', '1-2', '2-3', '3-5', '5-7', 'senior']).optional(),
}).strip();

// Chrome extension: save a job found externally
export const saveExternalJobSchema = z.object({
  job: z.object({
    title:       z.string().min(1).max(200),
    company:     z.string().max(200).optional(),
    location:    z.string().max(200).optional(),
    description: z.string().max(10_000).optional(),
    applyUrl:    safeUrl,
  }),
}).strip();

export const quickMatchSchema = z.any();

export const matchResumeSchema = z.object({
  resumeId:   z.string().uuid(),
  role:       z.string().max(150).trim().optional(),
  location:   z.string().max(150).trim().optional(),
  remote:     z.enum(['any', 'remote', 'onsite', 'hybrid']).optional(),
  experience: z.enum(['any', 'fresher', '1-2', '2-3', '3-5', '5-7', 'senior']).optional(),
  datePosted: z.enum(['any', '1d', '3d', '7d', '30d']).optional(),
}).strip();
