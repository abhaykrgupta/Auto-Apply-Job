import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimitedOpenAI, openAiQueue } from '@/lib/openai/rate-limiter';

describe('rateLimitedOpenAI', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    openAiQueue.clear();
  });

  it('queues concurrent calls without exceeding concurrency limit', async () => {
    let activeCalls = 0;
    let maxActiveCalls = 0;
    
    const mockCall = vi.fn().mockImplementation(async () => {
      activeCalls++;
      if (activeCalls > maxActiveCalls) maxActiveCalls = activeCalls;
      await new Promise(resolve => setTimeout(resolve, 100));
      activeCalls--;
      return 'done';
    });

    const promises = Array.from({ length: 10 }).map(() => rateLimitedOpenAI(mockCall));
    
    // Fast forward to complete all calls
    await vi.runAllTimersAsync();
    await Promise.all(promises);

    expect(maxActiveCalls).toBeLessThanOrEqual(5); // Concurrency is 5
    expect(mockCall).toHaveBeenCalledTimes(10);
  });

  it('triggers exponential backoff on RateLimitError', async () => {
    const rateLimitErr = new Error('Rate limit');
    (rateLimitErr as any).status = 429;
    
    const mockCall = vi.fn()
      .mockRejectedValueOnce(rateLimitErr)
      .mockResolvedValueOnce('success');

    const promise = rateLimitedOpenAI(mockCall);
    
    await vi.advanceTimersByTimeAsync(1000);
    
    const result = await promise;
    expect(result).toBe('success');
    expect(mockCall).toHaveBeenCalledTimes(2);
  });

  it('re-throws error after max retries', async () => {
    const rateLimitErr = new Error('Rate limit');
    (rateLimitErr as any).status = 429;
    const mockCall = vi.fn().mockRejectedValue(rateLimitErr);
    
    const promise = rateLimitedOpenAI(mockCall);
    const catchPromise = expect(promise).rejects.toThrow('Rate limit');
    
    await vi.advanceTimersByTimeAsync(32000);
    
    await catchPromise;
    expect(mockCall).toHaveBeenCalledTimes(5);
  });
});
