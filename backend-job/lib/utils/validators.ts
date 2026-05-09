import { z } from 'zod';

export const JobFiltersSchema = z.object({
  role: z.string().optional(),
  location: z.string().optional(),
  remote: z.enum(['any', 'remote', 'hybrid', 'onsite']).default('any'),
  jobType: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  sources: z.array(z.string()).optional(),
});

export type JobFilters = z.infer<typeof JobFiltersSchema>;

export const ProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  portfolio: z.string().url().optional().or(z.literal('')),
  preferredRoles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  remotePreference: z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
});

export type ProfileData = z.infer<typeof ProfileSchema>;
