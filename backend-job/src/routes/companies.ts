import { FastifyInstance } from 'fastify';
import { getCompanies, getCompanyStats } from '../../lib/actions/companies';

export default async function companiesRoutes(server: FastifyInstance) {
  server.get('/api/companies', async (request, reply) => {
    try {
      const [companies, stats] = await Promise.all([getCompanies(), getCompanyStats()]);
      return { companies, stats };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      server.log.error('[API Companies GET] ' + message);
      reply.status(500).send({ error: `Database error: ${message}` });
    }
  });
}
