import { describe, it, expect } from 'vitest';
import { batchApplyBodySchema } from '@/lib/validations/jobs';
import { resumeUploadSchema } from '@/lib/validations/resume';
import { applicationStatusUpdateSchema } from '@/lib/validations/applications';

describe('Zod Schemas', () => {
  describe('batchApplyBodySchema', () => {
    it('valid input passes', () => {
      const result = batchApplyBodySchema.safeParse({ jobIds: ['123e4567-e89b-12d3-a456-426614174000'] });
      expect(result.success).toBe(true);
    });

    it('missing required fields fail', () => {
      const result = batchApplyBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('unknown fields are stripped', () => {
      const result = batchApplyBodySchema.safeParse({ jobIds: ['123e4567-e89b-12d3-a456-426614174000'], unknownField: 'foo' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).unknownField).toBeUndefined();
      }
    });

    it('out of range values fail (jobIds > 50)', () => {
      const jobIds = new Array(51).fill('123e4567-e89b-12d3-a456-426614174000');
      const result = batchApplyBodySchema.safeParse({ jobIds });
      expect(result.success).toBe(false);
    });
  });

  describe('resumeUploadSchema', () => {
    it('valid input passes', () => {
      const result = resumeUploadSchema.safeParse({ name: 'My Resume' });
      expect(result.success).toBe(true);
    });
    
    it('missing name fails', () => {
      const result = resumeUploadSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('applicationStatusUpdateSchema', () => {
    it('valid input passes', () => {
      const result = applicationStatusUpdateSchema.safeParse({ status: 'applied' });
      expect(result.success).toBe(true);
    });
  });
});
