import { FastifyInstance } from 'fastify';
import { getResumes, toggleResumeActive, updateResumeLabel, deleteResume, uploadResume } from '../../lib/actions/resume';
import { resumeUpdateSchema, resumeDeleteSchema } from '../../lib/validations/resume';

export default async function resumeRoutes(server: FastifyInstance) {
  server.get('/api/resume', async (request, reply) => {
    try {
      const resumes = await getResumes();
      return resumes;
    } catch (err) {
      server.log.error('[API Resume GET] ' + err);
      reply.status(500).send({ error: 'Database error' });
    }
  });

  server.patch('/api/resume', async (request, reply) => {
    try {
      const parsed = resumeUpdateSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      
      const { id, isActive, label } = parsed.data;
      if (typeof isActive === 'boolean') await toggleResumeActive(id, isActive);
      if (typeof label === 'string') await updateResumeLabel(id, label);
      
      return { ok: true };
    } catch (err) {
      server.log.error('[API Resume PATCH] ' + err);
      reply.status(500).send({ error: 'Update failed' });
    }
  });

  server.delete('/api/resume', async (request, reply) => {
    try {
      const parsed = resumeDeleteSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      
      await deleteResume(parsed.data.id);
      return { ok: true };
    } catch (err) {
      server.log.error('[API Resume DELETE] ' + err);
      reply.status(500).send({ error: 'Delete failed' });
    }
  });

  server.post('/api/resume/parse', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) return reply.status(400).send({ error: 'No file provided' });
      
      // Fastify-multipart handles this. We need to convert it to a FormData-like structure or handle buffer
      const buffer = await data.toBuffer();
      const fileName = data.filename;
      
      // We need to adapt uploadResume to handle buffer directly if possible, or create a mock FormData
      // For now, let's just use a helper to handle the upload logic since we have the buffer
      const { saveUploadedFile } = await import('../../lib/utils/file-upload');
      const { parseResume } = await import('../../lib/openai/resume-parser');
      const { db } = await import('../../lib/db');
      const { resumes: resumesTable, profile: profileTable } = await import('../../lib/db/schema');
      
      const { filePath, fileUrl } = await saveUploadedFile(buffer, fileName);
      
      let [existingProfile] = await db.select().from(profileTable).limit(1);
      if (!existingProfile) {
        [existingProfile] = await db.insert(profileTable).values({ name: 'User', email: 'user@example.com' }).returning();
      }
      
      const pdfParse = require('pdf-parse');
      const pdf = await pdfParse(buffer);
      const parsedData = await parseResume(pdf.text);
      
      const [resume] = await db.insert(resumesTable).values({
        profileId: existingProfile.id,
        fileName,
        filePath,
        fileUrl,
        parsedData,
        label: fileName.replace(/\.[^.]+$/, ''),
        isActive: true,
      }).returning();
      
      return resume;
    } catch (err) {
      server.log.error('[API Resume Parse POST] ' + err);
      reply.status(500).send({ error: 'Upload failed' });
    }
  });
}
