import { test, expect } from '@playwright/test';

test.describe('Batch Apply Validation', () => {
  test('POST to /api/jobs/batch-apply with empty body -> expect 400', async ({ request }) => {
    const response = await request.post('/api/jobs/batch-apply', {
      data: {}
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('POST with jobIds array > 50 -> expect 400', async ({ request }) => {
    const jobIds = Array.from({ length: 51 }, (_, i) => '123e4567-e89b-12d3-a456-426614174000');
    const response = await request.post('/api/jobs/batch-apply', {
      data: { jobIds }
    });
    expect(response.status()).toBe(400);
  });

  test('POST with non-UUID strings -> expect 400', async ({ request }) => {
    const response = await request.post('/api/jobs/batch-apply', {
      data: { jobIds: ['not-a-uuid'] }
    });
    expect(response.status()).toBe(400);
  });
});
