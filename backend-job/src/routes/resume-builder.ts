import { FastifyInstance } from 'fastify';
import { db } from '../../lib/db';
import { resumeProjects, profile } from '../../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function getOrCreateProfile() {
  const profiles = await db.select().from(profile).limit(1);
  if (profiles.length > 0) return profiles[0];
  const [p] = await db.insert(profile).values({ name: 'User', email: 'user@example.com' }).returning();
  return p;
}

export default async function resumeBuilderRoutes(server: FastifyInstance) {
  server.get('/api/resume-builder', async (request, reply) => {
    try {
      const p = await getOrCreateProfile();
      const projects = await db.select().from(resumeProjects)
        .where(eq(resumeProjects.profileId, p.id))
        .orderBy(desc(resumeProjects.updatedAt));
      return projects;
    } catch (e: any) {
      reply.status(500).send({ error: e.message });
    }
  });

  server.post('/api/resume-builder', async (request, reply) => {
    try {
      const body = (request.body as any) || {};
      const p = await getOrCreateProfile();
      const [project] = await db.insert(resumeProjects).values({
        profileId: p.id,
        name: body.name || 'Untitled Resume',
        data: body.data || {},
        templateId: body.templateId || 'classic',
      }).returning();
      return project;
    } catch (e: any) {
      reply.status(500).send({ error: e.message });
    }
  });
}
