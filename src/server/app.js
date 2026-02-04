import Fastify from 'fastify';
import cors from '@fastify/cors';

/**
 * Create Fastify application
 * @param {object} context - Application context (db, config, logger, router, etc.)
 * @returns {FastifyInstance} Fastify app
 */
export function createApp(context) {
  const fastify = Fastify({
    logger: context.logger
  });

  // Register CORS
  fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    // Handle custom errors
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    reply.status(statusCode).send({
      error: {
        message,
        statusCode,
        ...(error.period && { period: error.period }),
        ...(error.spent && { spent: error.spent }),
        ...(error.limit && { limit: error.limit })
      }
    });
  });

  // Register routes (must be done before server starts)
  return fastify;
}

/**
 * Register all routes
 * @param {FastifyInstance} app - Fastify instance
 * @param {object} context - Application context
 */
export async function registerRoutes(app, context) {
  const { healthRoute } = await import('./routes/health.js');
  const { completionsRoute } = await import('./routes/completions.js');
  const { budgetRoute } = await import('./routes/budget.js');
  const { modelsRoute } = await import('./routes/models.js');
  const { accountsRoute } = await import('./routes/accounts.js');

  await app.register(healthRoute, { prefix: '/v1', ...context });
  await app.register(completionsRoute, { prefix: '/v1', ...context });
  await app.register(budgetRoute, { prefix: '/v1', ...context });
  await app.register(modelsRoute, { prefix: '/v1', ...context });
  await app.register(accountsRoute, { prefix: '/v1', ...context });
}
