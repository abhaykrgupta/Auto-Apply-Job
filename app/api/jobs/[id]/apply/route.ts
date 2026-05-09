import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    let body = {};
    if (req.headers.get('content-length') !== '0') {
      try { body = await req.json(); } catch (e) {}
    }

    const res = await fetch(`${BACKEND_URL}/api/jobs/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apply failed';
    console.error('[/api/jobs/[id]/apply Proxy]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
