import PQueue from 'p-queue';

const RPM = parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '50', 10);
const TPM = parseInt(process.env.OPENAI_RATE_LIMIT_TPM || '100000', 10); // TPM not strictly required by PQueue unless we track tokens

// Singleton queue instance
export const openAiQueue = new PQueue({
  concurrency: 5,
  intervalCap: RPM,
  interval: 60000,
});

export async function rateLimitedOpenAI<T>(fn: () => Promise<T>): Promise<T> {
  return openAiQueue.add(async () => {
    let attempt = 0;
    while (attempt < 5) {
      try {
        return await fn();
      } catch (error: any) {
        // Check if it's a RateLimitError
        // In OpenAI SDK, status 429 usually indicates rate limit
        const isRateLimit = error?.status === 429 || error?.code === 'rate_limit_exceeded';
        
        if (isRateLimit && attempt < 4) {
          const waitTime = Math.min(Math.pow(2, attempt) * 1000, 32000);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          attempt++;
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }) as Promise<T>;
}
