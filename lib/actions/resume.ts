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

  // Get or create default profile
  let [existingProfile] = await db.select().from(profile).limit(1);
  if (!existingProfile) {
    [existingProfile] = await db
      .insert(profile)
      .values({ name: 'User', email: 'user@example.com' })
      .returning();
  }

  // Extract text from PDF, then parse with AI
  let parsedData = null;
  try {
    const pdf = await pdfParse(buffer);
    const fileContent = pdf.text;
    parsedData = await parseResume(fileContent);
  } catch (e) {
    console.error('[uploadResume] parse failed:', e);
  }

  const [resume] = await db
    .insert(resumes)
    .values({
      profileId: existingProfile.id,
      fileName: file.name,
      filePath,
      fileUrl,
      parsedData,
      isActive: true,
    })
    .returning();

  revalidatePath('/resume');
  return resume;
}

export async function getResumes() {
  return db.select().from(resumes).orderBy(resumes.createdAt);
}

export async function getResumeById(id: string) {
  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  return resume;
}

export async function deleteResume(id: string) {
  await db.delete(resumes).where(eq(resumes.id, id));
  revalidatePath('/resume');
}

export async function setActiveResume(id: string) {
  await db.update(resumes).set({ isActive: false });
  await db.update(resumes).set({ isActive: true }).where(eq(resumes.id, id));
  revalidatePath('/resume');
}
