import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) return new NextResponse('Missing url parameter', { status: 400 });

  // Simply redirect or proxy to the backend's static file serving
  // Fastify is configured to serve public/ at /public/
  const backendFileUrl = `${BACKEND_URL}/public${url}`;

  try {
    const res = await fetch(backendFileUrl);
    if (!res.ok) return new NextResponse('File not found', { status: 404 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('Content-Type') || 'application/pdf';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[Resume View Proxy Error]', err);
    return new NextResponse('Error fetching file from backend', { status: 500 });
  }
}
