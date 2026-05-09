import { FastifyInstance } from 'fastify';
import { getResumes, toggleResumeActive, updateResumeLabel, deleteResume } from '../../lib/actions/resume';
import { resumeUpdateSchema, resumeDeleteSchema } from '../../lib/validations/resume';
import { saveUploadedFile } from '../../lib/utils/file-upload';
import { parseResume } from '../../lib/openai/resume-parser';
import { db } from '../../lib/db';
import { resumes as resumesTable, profile as profileTable } from '../../lib/db/schema';
import { PDFParse } from 'pdf-parse';

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
      const query = request.query as { dryRun?: string };
      const isDryRun = query.dryRun === 'true';

      const data = await request.file();
      if (!data) return reply.status(400).send({ error: 'No file provided' });
      
      const buffer = await data.toBuffer();
      const fileName = data.filename;
      
      const { filePath, fileUrl } = await saveUploadedFile(buffer, fileName);
      
      let [existingProfile] = await db.select().from(profileTable).limit(1);
      if (!existingProfile) {
        [existingProfile] = await db.insert(profileTable).values({ name: 'User', email: 'user@example.com' }).returning();
      }
      
      const parser = new PDFParse({ data: buffer });
      const pdf = await parser.getText();
      await parser.destroy();
      
      const parsedData = await parseResume(pdf.text);
      
      if (isDryRun) {
        return {
          parsedData,
          fileName,
          fileUrl,
        };
      }
      
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
    } catch (err: any) {
      server.log.error('[API Resume Parse POST] Error:', err);
      reply.status(500).send({ error: 'Upload failed', message: err.message });
    }
  });
}
