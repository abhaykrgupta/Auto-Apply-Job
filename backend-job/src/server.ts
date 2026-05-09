import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import path from 'path';

const server = fastify({
  logger: true
});

// Register Plugins
server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});
server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
server.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/', // optional: default '/'
});

// Register CORS
server.register(cors, {
  origin: true // Allow all origins for now, configure strictly in production
});

// Health check route
server.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register API Routes
import companiesRoutes from './routes/companies';
import jobsRoutes from './routes/jobs';
import applicationsRoutes from './routes/applications';
import resumeRoutes from './routes/resume';
import resumeBuilderRoutes from './routes/resume-builder';

server.register(companiesRoutes);
server.register(jobsRoutes);
server.register(applicationsRoutes);
server.register(resumeRoutes);
server.register(resumeBuilderRoutes);

import analyticsRoutes from './routes/analytics';
import savedSearchesRoutes from './routes/saved-searches';
import applyRoutes from './routes/apply';

server.register(analyticsRoutes);
server.register(savedSearchesRoutes);
server.register(applyRoutes);

import { initializeWorkers } from './queue';

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
    
    // Initialize BullMQ Workers
    if (process.env.ENABLE_WORKERS === 'true') {
      initializeWorkers();
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
