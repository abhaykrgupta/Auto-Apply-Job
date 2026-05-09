import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobIds } = body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'jobIds array is required' }, { status: 400 });
    }

    // For each job, call the single apply endpoint on the backend
    const results = await Promise.allSettled(
      jobIds.map(async (jobId: string) => {
        const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`Failed for job ${jobId}`);
        return res.json();
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ queued: succeeded, failed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Batch apply failed';
    console.error('[/api/jobs/batch-apply Proxy]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
