import { z } from 'zod';

export const applicationStatusUpdateSchema = z.object({
  status: z.string(),
  errorMessage: z.string().optional(),
  screenshotPath: z.string().optional(),
}).strip();

export const applicationLogEntrySchema = z.object({
  level: z.string(),
  message: z.string(),
}).strip();
