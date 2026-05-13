import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { resumes, profile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { saveUploadedFile } from '@/lib/utils/file-upload';
import { parseResume } from '@/lib/openai/resume-parser';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt']);

function validateMagicBytes(bytes: Uint8Array, ext: string): boolean {
  if (ext === 'pdf') return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (ext === 'docx') return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (ext === 'doc') return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (ext === 'txt') {
    const hasExe = bytes[0] === 0x4d && bytes[1] === 0x5a;
    return !hasExe;
  }
  return false;
}

export async function POST(req: NextRequest) {
  // 1. Auth — require a valid session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const isDryRun = url.searchParams.get('dryRun') === 'true';

    const formData = await req.formData();
    // Accept either 'file' or 'resume' key (modal uses 'resume')
    const file = (formData.get('file') ?? formData.get('resume')) as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // 2. File size check
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 });
    }

    // 3. Extension check
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'Unsupported file type. Allowed: PDF, DOC, DOCX, TXT.' }, { status: 400 });
    }

    // 4. MIME type check
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Invalid MIME type.' }, { status: 400 });
    }

    // 5. Magic bytes check
    const headerBuffer = await file.slice(0, 8).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);
    if (!validateMagicBytes(headerBytes, ext)) {
      return NextResponse.json({ error: 'File content does not match its extension.' }, { status: 400 });
    }

    // 6. Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. Parse PDF text
    let parsedData = null;
    let parseWarning: string | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>;
      const pdf = await pdfParse(buffer);
      if (!pdf.text?.trim()) {
        parseWarning = 'Could not extract text — PDF may be image-only. Auto-fill will be limited.';
      } else {
        parsedData = await parseResume(pdf.text);
      }
    } catch (e) {
      console.error('[/api/resume/parse] parse error:', e);
      parseWarning = 'Resume text extraction failed. File saved but auto-fill will be limited.';
    }

    if (isDryRun) {
      return NextResponse.json({ parsedData, fileName: file.name, parseWarning, fileUrl: null });
    }

    // 8. Save file to disk
    const { filePath, fileUrl } = await saveUploadedFile(buffer, file.name);

    // 9. Find or create profile scoped to current user
    let [userProfile] = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, session.user.id))
      .limit(1);

    if (!userProfile) {
      [userProfile] = await db
        .insert(profile)
        .values({
          userId: session.user.id,
          name:   session.user.name  ?? 'User',
          email:  session.user.email ?? 'user@example.com',
        })
        .returning();
    }

    // 10. Save resume record linked to this user's profile
    const [resume] = await db
      .insert(resumes)
      .values({
        profileId: userProfile.id,
        fileName:  file.name,
        filePath,
        fileUrl,
        parsedData,
        label:     file.name.replace(/\.[^.]+$/, ''),
        isActive:  true,
      })
      .returning();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { filePath: _filePath, ...safeResume } = resume;
    return NextResponse.json({ ...safeResume, parseWarning });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('[/api/resume/parse POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
