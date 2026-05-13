'use server';

import { db } from '@/lib/db';
import { resumes, profile } from '@/lib/db/schema';
import { parseResume } from '@/lib/openai/resume-parser';
import { saveUploadedFile } from '@/lib/utils/file-upload';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>;

/** Get the profile for the current session user, or null. */
async function getCurrentProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [row] = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);
  return row ?? null;
}

export async function uploadResume(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const file = formData.get('resume') as File;
  if (!file) throw new Error('No file provided');

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { filePath, fileUrl } = await saveUploadedFile(buffer, file.name);

  // Find or create a profile scoped to the current user
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

  const baseName = file.name.replace(/\.[^.]+$/, '');

  const [resume] = await db
    .insert(resumes)
    .values({
      profileId: userProfile.id,
      fileName:  file.name,
      filePath,
      fileUrl,
      parsedData,
      label:     baseName,
      isActive:  true,
    })
    .returning();

  revalidatePath('/resume');
  return { ...resume, parseWarning };
}

export async function getResumes() {
  const p = await getCurrentProfile();
  if (!p) return [];
  return db.select().from(resumes).where(eq(resumes.profileId, p.id)).orderBy(resumes.createdAt);
}

export async function getActiveResumes() {
  const p = await getCurrentProfile();
  if (!p) return [];
  return db.select().from(resumes).where(and(eq(resumes.profileId, p.id), eq(resumes.isActive, true)));
}

export async function getResumeById(id: string) {
  const p = await getCurrentProfile();
  if (!p) throw new Error('Unauthorized');
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.profileId, p.id)))
    .limit(1);
  if (!resume) throw new Error('Resume not found');
  return resume;
}

export async function deleteResume(id: string) {
  const p = await getCurrentProfile();
  if (!p) throw new Error('Unauthorized');
  await db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.profileId, p.id)));
  revalidatePath('/resume');
}

export async function toggleResumeActive(id: string, isActive: boolean) {
  const p = await getCurrentProfile();
  if (!p) throw new Error('Unauthorized');
  await db
    .update(resumes)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(resumes.id, id), eq(resumes.profileId, p.id)));
  revalidatePath('/resume');
}

export async function updateResumeLabel(id: string, label: string) {
  const p = await getCurrentProfile();
  if (!p) throw new Error('Unauthorized');
  await db
    .update(resumes)
    .set({ label: label.trim() || null, updatedAt: new Date() })
    .where(and(eq(resumes.id, id), eq(resumes.profileId, p.id)));
  revalidatePath('/resume');
}
