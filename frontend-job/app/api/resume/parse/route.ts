import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${BACKEND_URL}/api/resume/parse`, {
      method: 'POST',
      body: formData // Note: Do NOT set Content-Type header when sending FormData
    });
    
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const result = await res.json();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('[/api/resume/parse POST Proxy]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
