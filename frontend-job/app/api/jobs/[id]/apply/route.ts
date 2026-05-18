import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: jobId } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse optional body (e.g. resumeId override)
    const body = await req.json().catch(() => ({}));

    // Forward to Fastify backend — it handles DB insert + BullMQ enqueue
    const backendRes = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    // Map 409 (already applied) to 200 so the UI doesn't show an error
    const status = backendRes.status === 409 ? 200 : backendRes.status;
    return NextResponse.json(data, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apply failed';
    console.error('[/api/jobs/[id]/apply proxy]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
