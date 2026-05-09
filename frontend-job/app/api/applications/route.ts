import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/applications`);
    if (!res.ok) throw new Error(`Backend responded with status: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Applications GET Proxy]', message);
    return NextResponse.json({ error: `Backend proxy error: ${message}` }, { status: 500 });
  }
}
