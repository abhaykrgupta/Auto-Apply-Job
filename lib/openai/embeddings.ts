import { openai } from './client';
import { rateLimitedOpenAI } from './rate-limiter';

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await rateLimitedOpenAI(() => openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  }));
  return response.data[0].embedding;
}
