import { z } from 'zod';

const CompletionRequestSchema = z.object({
  prompt: z.string().min(1),
  strategy: z.enum(['balanced', 'cost-first', 'speed-first', 'quality-first']).optional(),
  qualityGates: z.object({
    minIntelligence: z.number().min(1).max(10).optional(),
    minSpeed: z.number().min(1).max(10).optional(),
    maxLatency: z.number().min(0).optional(),
    blockLocal: z.boolean().optional(),
    blockedProviders: z.array(z.string()).optional()
  }).optional(),
  project: z.string().optional(),
  max_tokens: z.number().min(1).max(100000).optional()
});

/**
 * Completions endpoint
 */
export async function completionsRoute(fastify, opts) {
  fastify.post('/completions', async (request, reply) => {
    const { router } = opts;

    // Validate request
    let validatedRequest;
    try {
      validatedRequest = CompletionRequestSchema.parse(request.body);
    } catch (error) {
      return reply.status(400).send({
        error: {
          message: 'Invalid request',
          details: error.errors
        }
      });
    }

    // Route the request
    try {
      const result = await router.route(validatedRequest);

      return {
        text: result.text,
        usage: {
          prompt_tokens: result.usage.tokens_in,
          completion_tokens: result.usage.tokens_out,
          total_tokens: result.usage.tokens_in + result.usage.tokens_out
        },
        routing: result.routing,
        cost: result.cost,
        latency: result.total_latency,
        model: result.model,
        provider: result.provider
      };
    } catch (error) {
      throw error; // Let global error handler deal with it
    }
  });
}
