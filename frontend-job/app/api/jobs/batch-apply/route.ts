import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobIds } = body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'jobIds array is required' }, { status: 400 });
    }

    // Forward each job to the Fastify backend — it handles DB insert + BullMQ enqueue
    let queued = 0;
    let failed = 0;
    let skipped = 0;

    for (const jobId of jobIds) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (res.status === 409) {
          skipped++; // already applied
        } else if (res.ok) {
          queued++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return NextResponse.json({ queued, failed, skipped });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Batch apply failed';
    console.error('[/api/jobs/batch-apply proxy]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
