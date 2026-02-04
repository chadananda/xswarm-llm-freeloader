import { scoreModels } from '../scorer.js';

/**
 * Balanced strategy: Equal weight to cost, speed, and quality
 */
export class BalancedStrategy {
  constructor(config = {}) {
    this.weights = config.weights || {
      cost: 0.4,
      speed: 0.4,
      quality: 0.2
    };
  }

  /**
   * Score models using balanced strategy
   * @param {Array} models - Filtered models
   * @param {object} context - Additional context (budget headroom, etc.)
   * @returns {Array} Scored and sorted models
   */
  score(models, context = {}) {
    const scoredModels = scoreModels(models, this.weights);

    // Add routing reason
    return scoredModels.map((model, index) => ({
      ...model,
      routing_reason: `Balanced strategy (rank ${index + 1}/${scoredModels.length}): ` +
        `cost=${model.scoring_breakdown.cost.toFixed(2)}, ` +
        `speed=${model.scoring_breakdown.speed.toFixed(2)}, ` +
        `quality=${model.scoring_breakdown.quality.toFixed(2)}, ` +
        `score=${model.score.toFixed(3)}`
    }));
  }

  /**
   * Get strategy name
   * @returns {string}
   */
  getName() {
    return 'balanced';
  }
}
