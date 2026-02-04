/**
 * Model scoring algorithm
 */

/**
 * Score a model based on weights
 * @param {object} model - Model object
 * @param {object} weights - Weight configuration {cost, speed, quality}
 * @param {object} benchmarks - Benchmark values for normalization
 * @returns {number} Score between 0 and 1
 */
export function scoreModel(model, weights, benchmarks) {
  // Normalize cost (free = 1.0, expensive = 0.0)
  const costScore = model.pricing_input === 0
    ? 1.0
    : 1.0 - (model.pricing_input / benchmarks.maxCost);

  // Normalize speed (fast = 1.0, slow = 0.0)
  const speedScore = model.speed / 10;

  // Normalize quality (smart = 1.0, dumb = 0.0)
  const qualityScore = model.intelligence / 10;

  // Weighted sum
  const score =
    (costScore * weights.cost) +
    (speedScore * weights.speed) +
    (qualityScore * weights.quality);

  return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
}

/**
 * Calculate benchmarks from model dataset
 * @param {Array} models - Array of model objects
 * @returns {object} Benchmark values
 */
export function calculateBenchmarks(models) {
  if (models.length === 0) {
    return {
      maxCost: 100.0,
      maxSpeed: 10,
      maxIntelligence: 10
    };
  }

  const costs = models.map(m => m.pricing_input).filter(c => c > 0);
  const speeds = models.map(m => m.speed);
  const intelligences = models.map(m => m.intelligence);

  return {
    maxCost: costs.length > 0 ? Math.max(...costs) : 100.0,
    maxSpeed: Math.max(...speeds),
    maxIntelligence: Math.max(...intelligences)
  };
}

/**
 * Score models and return sorted list
 * @param {Array} models - Array of model objects
 * @param {object} weights - Weight configuration
 * @returns {Array} Models with scores, sorted descending
 */
export function scoreModels(models, weights) {
  const benchmarks = calculateBenchmarks(models);

  return models
    .map(model => ({
      ...model,
      score: scoreModel(model, weights, benchmarks),
      scoring_breakdown: {
        cost: model.pricing_input === 0 ? 1.0 : 1.0 - (model.pricing_input / benchmarks.maxCost),
        speed: model.speed / 10,
        quality: model.intelligence / 10
      }
    }))
    .sort((a, b) => b.score - a.score);
}
