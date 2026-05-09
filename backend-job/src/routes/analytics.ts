import { FastifyInstance } from 'fastify';
import { AnalyticsEngine } from '../../lib/analytics/analytics-engine';
import { db } from '../../lib/db';
import { aiUsageLogs } from '../../lib/db/schema';
import { desc } from 'drizzle-orm';
import { insightsGenerator } from '../../lib/intelligence/insights-generator';

export default async function analyticsRoutes(server: FastifyInstance) {
  server.get('/api/analytics', async (request, reply) => {
    try {
      const range = (request.query as any).range || '30d';
      const stats = await AnalyticsEngine.generateFullReport(range);
      return stats;
    } catch (err) {
      server.log.error(err);
      reply.status(500).send({ error: 'Failed to generate analytics' });
    }
  });

  server.get('/api/analytics/ai-costs', async (request, reply) => {
    try {
      const logs = await db.select().from(aiUsageLogs).orderBy(desc(aiUsageLogs.createdAt)).limit(100);
      const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
      return { totalCost, logs };
    } catch (err) {
      server.log.error(err);
      reply.status(500).send({ error: 'Failed to get costs' });
    }
  });

  server.get('/api/analytics/insights', async (request, reply) => {
    try {
      const insights = await insightsGenerator.generateInsights();
      return { insights };
    } catch (err) {
      server.log.error(err);
      reply.status(500).send({ error: 'Failed to generate insights' });
    }
  });
}
