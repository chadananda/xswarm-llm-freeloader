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

  // Register routes
  import('./routes/health.js').then(({ healthRoute }) => {
    fastify.register(healthRoute, { prefix: '/v1', ...context });
  });

  import('./routes/completions.js').then(({ completionsRoute }) => {
    fastify.register(completionsRoute, { prefix: '/v1', ...context });
  });

  import('./routes/budget.js').then(({ budgetRoute }) => {
    fastify.register(budgetRoute, { prefix: '/v1', ...context });
  });

  import('./routes/models.js').then(({ modelsRoute }) => {
    fastify.register(modelsRoute, { prefix: '/v1', ...context });
  });

  import('./routes/accounts.js').then(({ accountsRoute }) => {
    fastify.register(accountsRoute, { prefix: '/v1', ...context });
  });

  return fastify;
}
