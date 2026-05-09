

import { db } from '@/lib/db';
import { resumes, profile } from '@/lib/db/schema';
import { parseResume } from '@/lib/openai/resume-parser';
import { saveUploadedFile } from '@/lib/utils/file-upload';
import { eq } from 'drizzle-orm';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

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
  const { jobMatches, applications, generatedContent, resumePerformance, applicationLogs } = await import('@/lib/db/schema');
  const { inArray, eq } = await import('drizzle-orm');

  const [resume] = await db.select({ filePath: resumes.filePath }).from(resumes).where(eq(resumes.id, id));
  
  if (resume?.filePath) {
    try {
      const { unlink } = await import('fs/promises');
      // Use fs.access first to check if file exists
      const { access, constants } = await import('fs/promises');
      await access(resume.filePath, constants.F_OK);
      await unlink(resume.filePath);
    } catch (err) {
      // If file doesn't exist, just log it and continue
      console.warn(`[deleteResume] File not found or inaccessible: ${resume.filePath}`);
    }
  }

  // Manual Cascade for Resume Deletion
  // 1. Find all application IDs for this resume
  const resumeApps = await db.select({ id: applications.id }).from(applications).where(eq(applications.resumeId, id));
  const appIds = resumeApps.map(a => a.id);
  
  if (appIds.length > 0) {
      await db.delete(applicationLogs).where(inArray(applicationLogs.applicationId, appIds));
  }

  // 2. Delete references
  await db.delete(jobMatches).where(eq(jobMatches.resumeId, id));
  await db.delete(applications).where(eq(applications.resumeId, id));
  await db.delete(generatedContent).where(eq(generatedContent.resumeId, id));
  await db.delete(resumePerformance).where(eq(resumePerformance.resumeId, id));

  // 3. Delete the resume itself
  await db.delete(resumes).where(eq(resumes.id, id));
}

export async function toggleResumeActive(id: string, isActive: boolean) {
  await db.update(resumes).set({ isActive, updatedAt: new Date() }).where(eq(resumes.id, id));

}

export async function updateResumeLabel(id: string, label: string) {
  await db.update(resumes).set({ label: label.trim() || null, updatedAt: new Date() }).where(eq(resumes.id, id));

}
