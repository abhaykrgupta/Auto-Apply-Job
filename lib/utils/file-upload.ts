import { writeFile, mkdir, access } from 'fs/promises';
import path from 'path';

export async function saveUploadedFile(
  buffer: Buffer,
  fileName: string,
  folder = 'uploads'
): Promise<{ filePath: string; fileUrl: string }> {
  const uploadsDir = path.join(process.cwd(), 'public', folder);
  await mkdir(uploadsDir, { recursive: true });

  // Clean name: keep original base name + extension only, replace spaces/special chars
  const ext = path.extname(fileName) || '.pdf';
  const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  // Add number suffix if file already exists: Resume.pdf → Resume_2.pdf → Resume_3.pdf
  let safeFileName = `${base}${ext}`;
  let counter = 2;
  while (true) {
    try { await access(path.join(uploadsDir, safeFileName)); safeFileName = `${base}_${counter++}${ext}`; }
    catch { break; }
  }

  const filePath = path.join(uploadsDir, safeFileName);

  await writeFile(filePath, buffer);

  return {
    filePath,
    fileUrl: `/${folder}/${safeFileName}`,
  };
}

export async function extractTextFromPDF(filePath: string): Promise<string> {
  // Simple text extraction — in production use pdf-parse or similar
  const { readFile } = await import('fs/promises');
  const buffer = await readFile(filePath);
  // Return raw buffer as string for now; replace with real PDF parser
  return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').trim();
}
