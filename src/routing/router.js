import { applyQualityGates } from './qualityGates.js';
import { BalancedStrategy } from './strategies/balanced.js';
import { executeWithFallback } from './fallback.js';
import { NoProvidersAvailableError } from '../utils/errors.js';

/**
 * Main routing orchestrator
 */
export class Router {
  constructor(db, litellmClient, budgetEnforcer, config, logger) {
    this.db = db;
    this.litellmClient = litellmClient;
    this.budgetEnforcer = budgetEnforcer;
    this.config = config;
    this.logger = logger;

    // Initialize strategies
    this.strategies = {
      balanced: new BalancedStrategy(config.routing)
    };
  }

  /**
   * Route a completion request
   * @param {object} request - Request object
   * @returns {Promise<object>} Response with routing metadata
   */
  async route(request) {
    const {
      prompt,
      strategy = 'balanced',
      qualityGates = {},
      project = 'default',
      max_tokens = 1024
    } = request;

    this.logger.info(`Routing request for project ${project} with strategy ${strategy}`);

    // 1. Get all available models
    const allModels = this.db.models.getAll();

    if (allModels.length === 0) {
      throw new NoProvidersAvailableError('No models configured in database');
    }

    // 2. Apply quality gates
    const mergedGates = {
      ...this.config.routing.qualityGates,
      ...qualityGates
    };

    const filtered = applyQualityGates(allModels, mergedGates);

    if (filtered.length === 0) {
      throw new NoProvidersAvailableError(
        'All models filtered out by quality gates'
      );
    }

    this.logger.info(`${filtered.length} models passed quality gates`);

    // 3. Check budget headroom (estimate cost)
    const estimatedCost = 0.10; // Rough estimate, will track actual cost later
    this.budgetEnforcer.checkBudget(project, estimatedCost);

    // 4. Score models based on strategy
    const selectedStrategy = this.strategies[strategy] || this.strategies.balanced;
    const scored = selectedStrategy.score(filtered, {
      budgetHeadroom: estimatedCost,
      config: this.config
    });

    this.logger.info(`Top candidate: ${scored[0].provider}/${scored[0].name} (score: ${scored[0].score.toFixed(3)})`);

    // 5. Try models in order with fallback
    const startTime = Date.now();

    const result = await executeWithFallback(
      scored,
      async (candidate) => {
        // Build LiteLLM request
        const litellmRequest = {
          model: `${candidate.provider}/${candidate.name}`,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens
        };

        // Execute via LiteLLM
        const response = await this.litellmClient.completion(litellmRequest);

        if (!response.success) {
          throw new Error(response.error);
        }

        return {
          text: response.data.choices[0].message.content,
          usage: response.usage,
          latency: response.latency,
          model: candidate.name,
          provider: candidate.provider
        };
      },
      this.logger
    );

    const totalLatency = Date.now() - startTime;

    // 6. Calculate actual cost
    const model = this.db.models.get(result.provider, result.model);
    const actualCost =
      (result.usage.tokens_in / 1_000_000) * model.pricing_input +
      (result.usage.tokens_out / 1_000_000) * model.pricing_output;

    // 7. Record usage
    this.budgetEnforcer.recordUsage(project, actualCost);

    // Log usage to database
    this.db.usage.log({
      provider: result.provider,
      model: result.model,
      project,
      tokens_in: result.usage.tokens_in,
      tokens_out: result.usage.tokens_out,
      cost_usd: actualCost,
      latency_ms: totalLatency,
      success: true,
      routing_reason: result.routing.reason
    });

    return {
      ...result,
      cost: actualCost,
      total_latency: totalLatency
    };
  }
}
