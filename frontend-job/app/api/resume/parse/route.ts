import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const isDryRun = url.searchParams.get('dryRun') === 'true';
    
    const formData = await req.formData();
    const res = await fetch(`${BACKEND_URL}/api/resume/parse${isDryRun ? '?dryRun=true' : ''}`, {
      method: 'POST',
      body: formData // Note: Do NOT set Content-Type header when sending FormData
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Backend error: ${res.status}`);
    }
    const result = await res.json();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('[/api/resume/parse POST Proxy]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
