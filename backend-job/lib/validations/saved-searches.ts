import { z } from 'zod';

export const savedSearchSchema = z.object({
  name: z.string(),
  query: z.string(),
  filters: z.any()
}).strip();

export const savedSearchDeleteSchema = z.object({
  id: z.string().uuid()
}).strip();
