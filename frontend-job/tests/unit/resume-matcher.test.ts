import { describe, it, expect, vi } from 'vitest';
import { findBestResume } from '@/lib/utils/resume-matcher';
import * as embeddings from '@/lib/openai/embeddings';

describe('resume-matcher', () => {
  it('returns the resume with highest cosine similarity', async () => {
    vi.spyOn(embeddings, 'getEmbedding').mockImplementation(async (text) => {
      if (text.includes('Job')) return [1, 0];
      if (text.includes('Good')) return [0.9, 0.1];
      if (text.includes('Bad')) return [0, 1];
      return [0.5, 0.5];
    });

    const resumes = [
      { id: '1', parsedData: { text: 'Bad resume' } },
      { id: '2', parsedData: { text: 'Good resume' } },
    ];

    const result = await findBestResume('Job description', resumes);
    expect(result.resume.id).toBe('2');
  });

  it('edge case: 1 resume returns the only resume', async () => {
    vi.spyOn(embeddings, 'getEmbedding').mockResolvedValue([1, 0]);
    const resumes = [{ id: '1', parsedData: { text: 'Only resume' } }];
    const result = await findBestResume('Job description', resumes);
    expect(result.resume.id).toBe('1');
  });

  it('edge case: identical scores return first', async () => {
    vi.spyOn(embeddings, 'getEmbedding').mockResolvedValue([1, 0]);
    const resumes = [
      { id: '1', parsedData: { text: 'Same' } },
      { id: '2', parsedData: { text: 'Same' } },
    ];
    const result = await findBestResume('Job description', resumes);
    expect(result.resume.id).toBe('1');
  });
});
