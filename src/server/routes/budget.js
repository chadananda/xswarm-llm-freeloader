/**
 * Budget information endpoint
 */
export async function budgetRoute(fastify, opts) {
  fastify.get('/budget', async (request, reply) => {
    const { budgetTracker } = opts;
    const project = request.query.project || 'default';

    const status = budgetTracker.getStatus(project);

    return {
      project,
      daily: {
        spent: status.daily.spent,
        limit: status.daily.limit,
        remaining: status.daily.remaining,
        percent: status.daily.percent,
        soft_limit_exceeded: status.daily.soft_limit_exceeded,
        hard_limit_exceeded: status.daily.hard_limit_exceeded
      },
      monthly: {
        spent: status.monthly.spent,
        limit: status.monthly.limit,
        remaining: status.monthly.remaining,
        percent: status.monthly.percent,
        soft_limit_exceeded: status.monthly.soft_limit_exceeded,
        hard_limit_exceeded: status.monthly.hard_limit_exceeded
      }
    };
  });
}
