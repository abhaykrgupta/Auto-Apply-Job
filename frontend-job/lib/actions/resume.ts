'use server';

import { db } from '@/lib/db';
import { resumes, profile } from '@/lib/db/schema';
import { parseResume } from '@/lib/openai/resume-parser';
import { saveUploadedFile } from '@/lib/utils/file-upload';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>;

export async function uploadResume(formData: FormData) {
  const file = formData.get('resume') as File;
  if (!file) throw new Error('No file provided');

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { filePath, fileUrl } = await saveUploadedFile(buffer, file.name);

  let [existingProfile] = await db.select().from(profile).limit(1);
  if (!existingProfile) {
    [existingProfile] = await db
      .insert(profile)
      .values({ name: 'User', email: 'user@example.com' })
      .returning();
  }

  let parsedData = null;
  let parseWarning: string | null = null;
  try {
    const pdf = await pdfParse(buffer);
    if (!pdf.text?.trim()) {
      parseWarning = 'Could not extract text from this PDF — it may be image-only or scanned. Auto-apply will work but skill matching will be limited.';
    } else {
      parsedData = await parseResume(pdf.text);
    }
  } catch (e) {
    console.error('[uploadResume] parse failed:', e);
    parseWarning = 'Resume text extraction failed. The file was saved but could not be parsed for auto-fill.';
  }

  // Use filename (without extension) as default label
  const baseName = file.name.replace(/\.[^.]+$/, '');

  const [resume] = await db
    .insert(resumes)
    .values({
      profileId: existingProfile.id,
      fileName: file.name,
      filePath,
      fileUrl,
      parsedData,
      label: baseName,
      isActive: true,
    })
    .returning();

  revalidatePath('/resume');
  return { ...resume, parseWarning };
}

export async function getResumes() {
  return db.select().from(resumes).orderBy(resumes.createdAt);
}

export async function getActiveResumes() {
  return db.select().from(resumes).where(eq(resumes.isActive, true));
}

export async function getResumeById(id: string) {
  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  return resume;
}

export async function deleteResume(id: string) {
  await db.delete(resumes).where(eq(resumes.id, id));
  revalidatePath('/resume');
}

export async function toggleResumeActive(id: string, isActive: boolean) {
  await db.update(resumes).set({ isActive, updatedAt: new Date() }).where(eq(resumes.id, id));
  revalidatePath('/resume');
}

export async function updateResumeLabel(id: string, label: string) {
  await db.update(resumes).set({ label: label.trim() || null, updatedAt: new Date() }).where(eq(resumes.id, id));
  revalidatePath('/resume');
}
