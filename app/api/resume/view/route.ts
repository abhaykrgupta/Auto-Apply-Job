import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    // The url is stored as "/uploads/filename.pdf"
    // We need to resolve it to the absolute path in the public folder
    const filePath = path.join(process.cwd(), 'public', url);
    const buffer = await readFile(filePath);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="resume.pdf"',
      },
    });
  } catch (error) {
    console.error('Error reading PDF:', error);
    return new NextResponse('File not found or unreadable', { status: 404 });
  }
}
