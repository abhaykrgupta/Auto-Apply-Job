import { FastifyInstance } from 'fastify';
import { db } from '../../lib/db';
import { savedSearches } from '../../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function savedSearchesRoutes(server: FastifyInstance) {
  server.get('/api/saved-searches', async (request, reply) => {
    try {
      const results = await db.select().from(savedSearches).orderBy(desc(savedSearches.createdAt));
      return results;
    } catch (err) {
      server.log.error(err);
      reply.status(500).send({ error: 'Database error' });
    }
  });

  server.post('/api/saved-searches', async (request, reply) => {
    try {
      const body = request.body as any;
      const [saved] = await db.insert(savedSearches).values({
        name: body.name,
        query: body.query,
        filters: body.filters,
        notifyFrequency: body.notifyFrequency || 'daily',
        isActive: true,
      }).returning();
      return saved;
    } catch (err) {
      server.log.error(err);
      reply.status(500).send({ error: 'Failed to save search' });
    }
  });

  server.delete<{ Params: { id: string } }>('/api/saved-searches/:id', async (request, reply) => {
    try {
      await db.delete(savedSearches).where(eq(savedSearches.id, request.params.id));
      return { success: true };
    } catch (err) {
      server.log.error(err);
      reply.status(500).send({ error: 'Failed to delete' });
    }
  });
}
