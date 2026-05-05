import { getEmbedding } from '@/lib/openai/embeddings';
import { cosineSimilarity } from '@/lib/openai/cosine-similarity';

export type Resume = any; // or import type from schema if needed

function extractTextFromResume(resume: Resume): string {
  if (!resume?.parsedData) return '';
  return JSON.stringify(resume.parsedData);
}

export async function findBestResume(
  jobDescription: string,
  resumes: Resume[]
): Promise<{ resume: Resume; score: number }> {
  if (!resumes || resumes.length === 0) {
    throw new Error('No resumes provided');
  }

  const jobEmbedding = await getEmbedding(jobDescription);

  const scored = await Promise.all(
    resumes.map(async (resume) => {
      let resumeEmbedding: number[];
      
      // If the resume has a cached embedding in DB, use it
      if (resume.embedding && Array.isArray(resume.embedding)) {
        resumeEmbedding = resume.embedding;
      } else {
        const resumeText = extractTextFromResume(resume);
        resumeEmbedding = await getEmbedding(resumeText);
      }
      
      const score = cosineSimilarity(jobEmbedding, resumeEmbedding);
      return { resume, score };
    })
  );

  return scored.sort((a, b) => b.score - a.score)[0];
}
