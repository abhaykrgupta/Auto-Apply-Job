import { z } from 'zod';

export const resumeUploadSchema = z.object({
  name: z.string(),
  fileUrl: z.string().optional(),
  filePath: z.string().optional(),
}).strip();

export const resumeUpdateSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  label: z.string().optional(),
}).strip();

export const resumeDeleteSchema = z.object({
  id: z.string().uuid(),
}).strip();
export const resumeParseSchema = z.object({
  resumeId: z.string().uuid(),
}).strip();
