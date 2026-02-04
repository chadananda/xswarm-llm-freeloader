import { NoProvidersAvailableError } from '../utils/errors.js';

/**
 * Execute request with fallback
 * @param {Array} candidates - Sorted candidate models
 * @param {Function} executeFn - Function to execute request (async)
 * @param {object} logger - Logger instance
 * @returns {Promise<object>} Response from successful request
 * @throws {NoProvidersAvailableError} If all candidates fail
 */
export async function executeWithFallback(candidates, executeFn, logger) {
  const errors = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    try {
      logger.info(`Attempting request with ${candidate.provider}/${candidate.name} (rank ${i + 1}/${candidates.length})`);

      const result = await executeFn(candidate);

      logger.info(`Request successful with ${candidate.provider}/${candidate.name}`);

      return {
        ...result,
        routing: {
          provider: candidate.provider,
          model: candidate.name,
          rank: i + 1,
          total_candidates: candidates.length,
          attempts: i + 1,
          reason: candidate.routing_reason
        }
      };
    } catch (error) {
      logger.warn(
        `Request failed with ${candidate.provider}/${candidate.name}: ${error.message}`
      );

      errors.push({
        provider: candidate.provider,
        model: candidate.name,
        error: error.message,
        rank: i + 1
      });

      // Continue to next candidate
      continue;
    }
  }

  // All candidates failed
  throw new NoProvidersAvailableError(
    `All ${candidates.length} provider(s) failed. Errors: ${JSON.stringify(errors)}`
  );
}
