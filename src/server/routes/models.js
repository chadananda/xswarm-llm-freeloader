/**
 * Models listing endpoint
 */
export async function modelsRoute(fastify, opts) {
  fastify.get('/models', async (request, reply) => {
    const { db } = opts;

    const models = db.models.getAll();
    const providers = db.providers.getAll();

    // Group models by provider
    const byProvider = {};
    for (const model of models) {
      if (!byProvider[model.provider]) {
        byProvider[model.provider] = [];
      }
      byProvider[model.provider].push({
        name: model.name,
        intelligence: model.intelligence,
        speed: model.speed,
        context_window: model.context_window,
        pricing: {
          input: model.pricing_input,
          output: model.pricing_output,
          currency: 'USD',
          per: '1M tokens'
        },
        free_tier: model.free_tier_tokens
          ? {
              tokens: model.free_tier_tokens,
              period: model.free_tier_period
            }
          : null
      });
    }

    return {
      total: models.length,
      providers: providers.map(p => ({
        name: p.name,
        display_name: p.display_name,
        status: p.status,
        models: byProvider[p.name] || []
      }))
    };
  });
}
