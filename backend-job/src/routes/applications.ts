import { FastifyInstance } from 'fastify';
import { getApplications, getApplicationStats } from '../../lib/actions/applications';

export default async function applicationsRoutes(server: FastifyInstance) {
  server.get('/api/applications', async (request, reply) => {
    try {
      const applications = await getApplications();
      return applications;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      server.log.error('[API Applications GET] ' + message);
      reply.status(500).send({ error: `Database error: ${message}` });
    }
  });

  server.get('/api/applications/stats', async (request, reply) => {
    try {
      const stats = await getApplicationStats();
      return stats;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      server.log.error('[API Applications Stats GET] ' + message);
      reply.status(500).send({ error: `Database error: ${message}` });
    }
  });
}
