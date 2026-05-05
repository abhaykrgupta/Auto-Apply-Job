import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from '@/lib/openai/cosine-similarity';

describe('cosineSimilarity', () => {
  it('returns 1.0 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1.0);
  });

  it('returns 0.0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
  });

  it('returns -1.0 for opposite vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1.0);
  });

  it('works for realistic 1536-dim vectors', () => {
    const v1 = new Array(1536).fill(0).map(() => Math.random());
    const v2 = new Array(1536).fill(0).map(() => Math.random());
    const score = cosineSimilarity(v1, v2);
    expect(score).toBeGreaterThanOrEqual(-1);
    expect(score).toBeLessThanOrEqual(1);
  });
});
