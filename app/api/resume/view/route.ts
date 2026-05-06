import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const ALLOWED_FOLDERS = ['uploads', 'screenshots'];
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) return new NextResponse('Missing url parameter', { status: 400 });

  // Block path traversal and null bytes
  if (url.includes('..') || url.includes('\0') || !url.startsWith('/')) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const ext = path.extname(url).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return new NextResponse('File type not allowed', { status: 400 });
  }

  // Only serve files directly inside whitelisted folders — no subdirectories
  const parts = url.split('/').filter(Boolean); // e.g. ['uploads', 'resume.pdf']
  if (parts.length !== 2 || !ALLOWED_FOLDERS.includes(parts[0])) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  // Final path must still resolve inside public/ even after path.resolve
  const publicDir = path.join(process.cwd(), 'public');
  const resolved = path.resolve(publicDir, parts[0], parts[1]);
  if (!resolved.startsWith(publicDir + path.sep)) {
    return new NextResponse('Access denied', { status: 403 });
  }

  try {
    const buffer = await readFile(resolved);
    const contentType = ext === '.pdf' ? 'application/pdf' : 'image/png';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${parts[1]}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
