/**
 * Health check endpoint
 */
export async function healthRoute(fastify, opts) {
  fastify.get('/health', async (request, reply) => {
    const { db, budgetTracker, litellmManager } = opts;

    // Check database
    const providers = db.providers.getAll();
    const models = db.models.getAll();
    const accounts = db.accounts.getAll();

    // Check LiteLLM
    const litellmHealth = litellmManager.isRunning()
      ? await litellmManager.getClient().health()
      : { ok: false, error: 'Not running' };

    // Get budget status for default project
    const budgetStatus = budgetTracker.getStatus('default');

    return {
      status: 'ok',
      timestamp: Date.now(),
      database: {
        providers: providers.length,
        models: models.length,
        accounts: accounts.length
      },
      litellm: {
        running: litellmManager.isRunning(),
        healthy: litellmHealth.ok
      },
      budget: {
        daily: {
          spent: budgetStatus.daily.spent,
          limit: budgetStatus.daily.limit,
          remaining: budgetStatus.daily.remaining
        },
        monthly: {
          spent: budgetStatus.monthly.spent,
          limit: budgetStatus.monthly.limit,
          remaining: budgetStatus.monthly.remaining
        }
      }
    };
  });
}
