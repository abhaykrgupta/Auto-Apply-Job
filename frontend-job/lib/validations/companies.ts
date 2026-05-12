import { z } from 'zod';

export const companyAddSchema = z.object({
  url: z.string().url(),
}).strip();

export const companyAutoDiscoverSchema = z.object({
  keywords: z.array(z.string()).optional(),
  limit: z.number().optional(),
  sources: z.array(z.string()).optional(),
  skipAtsDetection: z.boolean().optional()
}).strip();

export const companyDiscoverSchema = z.object({
  url: z.string().url().optional(),
  sources: z.array(z.string()).optional(),
  skipAtsDetection: z.boolean().optional()
}).strip();

export const companyScrapeSchema = z.object({
  companyId: z.string().uuid().optional(),
  limit: z.number().optional(),
  query: z.string().optional(),
  experience: z.string().optional(),
  locationPref: z.string().optional(),
}).strip();
