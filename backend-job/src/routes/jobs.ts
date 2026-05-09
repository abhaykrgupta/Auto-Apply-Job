import { FastifyInstance } from 'fastify';
import { getJobs, getJobById, getJobMatches } from '../../lib/actions/jobs';
import { db } from '../../lib/db';
import { jobs, jobMatches, applications, generatedContent, applicationLogs } from '../../lib/db/schema';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export default async function jobsRoutes(server: FastifyInstance) {
  server.get('/api/jobs', async (request, reply) => {
    try {
      const jobs = await getJobs();
      return jobs;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      server.log.error('[API Jobs GET] ' + message);
      reply.status(500).send({ error: `Database error: ${message}` });
    }
  });

  server.get<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
    try {
      const job = await getJobById(request.params.id);
      if (!job) return reply.status(404).send({ error: 'Job not found' });
      return job;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      server.log.error('[API Jobs GET By Id] ' + message);
      reply.status(500).send({ error: `Database error: ${message}` });
    }
  });

  server.get<{ Querystring: { resumeId?: string } }>('/api/jobs/matches', async (request, reply) => {
    try {
      const resumeId = request.query.resumeId;
      if (!resumeId) return reply.status(400).send({ error: 'resumeId is required' });
      const matches = await getJobMatches(resumeId);
      return matches;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      server.log.error('[API Jobs Matches GET] ' + message);
      reply.status(500).send({ error: `Database error: ${message}` });
    }
  });

  server.delete('/api/jobs', async (request, reply) => {
    try {
      const parsed = bulkDeleteSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const ids = parsed.data.ids;

      // Find all application IDs for these jobs
      const jobApps = await db.select({ id: applications.id }).from(applications).where(inArray(applications.jobId, ids));
      const appIds = jobApps.map(a => a.id);
      
      if (appIds.length > 0) {
          await db.delete(applicationLogs).where(inArray(applicationLogs.applicationId, appIds));
      }

      await db.delete(jobMatches).where(inArray(jobMatches.jobId, ids));
      await db.delete(applications).where(inArray(applications.jobId, ids));
      await db.delete(generatedContent).where(inArray(generatedContent.jobId, ids));

      await db.delete(jobs).where(inArray(jobs.id, ids));
      return { deleted: ids.length };
    } catch (err) {
      server.log.error('[API Jobs DELETE] ' + err);
      reply.status(500).send({ error: 'Failed to delete jobs' });
    }
  });
}
