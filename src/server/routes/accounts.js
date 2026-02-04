import { z } from 'zod';

const AddAccountSchema = z.object({
  provider: z.string().min(1),
  api_key: z.string().min(1),
  tier: z.enum(['free', 'pro']).optional(),
  priority: z.number().optional()
});

/**
 * Accounts management endpoint
 */
export async function accountsRoute(fastify, opts) {
  // List accounts
  fastify.get('/accounts', async (request, reply) => {
    const { db } = opts;

    const accounts = db.accounts.getAll();

    // Mask API keys
    return {
      accounts: accounts.map(acc => ({
        provider: acc.provider,
        idx: acc.idx,
        api_key: `${acc.api_key.slice(0, 10)}...${acc.api_key.slice(-4)}`,
        tier: acc.tier,
        priority: acc.priority,
        status: acc.status,
        created_at: acc.created_at,
        last_used: acc.last_used
      }))
    };
  });

  // Add account
  fastify.post('/accounts', async (request, reply) => {
    const { db, litellmManager } = opts;

    // Validate request
    let validatedRequest;
    try {
      validatedRequest = AddAccountSchema.parse(request.body);
    } catch (error) {
      return reply.status(400).send({
        error: {
          message: 'Invalid request',
          details: error.errors
        }
      });
    }

    // Check if provider exists
    const provider = db.providers.getByName(validatedRequest.provider);
    if (!provider) {
      return reply.status(404).send({
        error: {
          message: `Provider ${validatedRequest.provider} not found`
        }
      });
    }

    // Add account
    const account = db.accounts.insert(validatedRequest);

    // Regenerate LiteLLM config
    if (litellmManager.isRunning()) {
      await litellmManager.restart();
    }

    return {
      message: 'Account added successfully',
      account: {
        provider: account.provider,
        idx: account.idx,
        tier: account.tier,
        status: account.status
      }
    };
  });

  // Delete account
  fastify.delete('/accounts/:provider/:idx', async (request, reply) => {
    const { db, litellmManager } = opts;
    const { provider, idx } = request.params;

    const deleted = db.accounts.delete(provider, parseInt(idx));

    if (!deleted) {
      return reply.status(404).send({
        error: {
          message: 'Account not found'
        }
      });
    }

    // Regenerate LiteLLM config
    if (litellmManager.isRunning()) {
      await litellmManager.restart();
    }

    return {
      message: 'Account deleted successfully'
    };
  });
}
