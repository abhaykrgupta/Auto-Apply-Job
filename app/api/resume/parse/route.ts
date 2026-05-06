import { uploadResume } from '@/lib/actions/resume';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadResume(formData);
    // parseWarning is non-null when text extraction failed — client shows it as a toast warning
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
