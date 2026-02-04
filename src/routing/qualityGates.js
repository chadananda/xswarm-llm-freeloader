/**
 * Quality gates for filtering models
 */

/**
 * Apply quality gates to filter models
 * @param {Array} models - Array of model objects
 * @param {object} gates - Quality gate configuration
 * @returns {Array} Filtered models
 */
export function applyQualityGates(models, gates = {}) {
  return models.filter(model => {
    // Intelligence gate
    if (gates.minIntelligence && model.intelligence < gates.minIntelligence) {
      return false;
    }

    // Speed gate
    if (gates.minSpeed && model.speed < gates.minSpeed) {
      return false;
    }

    // Block local models
    if (gates.blockLocal && model.provider === 'local') {
      return false;
    }

    // Blocked providers
    if (gates.blockedProviders && gates.blockedProviders.includes(model.provider)) {
      return false;
    }

    // Max latency (estimated based on speed rating)
    if (gates.maxLatency) {
      const estimatedLatency = (11 - model.speed) * 1000; // Rough estimate: speed 10 = 1s, speed 1 = 10s
      if (estimatedLatency > gates.maxLatency) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get reason for model rejection
 * @param {object} model - Model object
 * @param {object} gates - Quality gate configuration
 * @returns {string|null} Rejection reason or null if passes
 */
export function getRejectionReason(model, gates = {}) {
  if (gates.minIntelligence && model.intelligence < gates.minIntelligence) {
    return `Intelligence ${model.intelligence} < minimum ${gates.minIntelligence}`;
  }

  if (gates.minSpeed && model.speed < gates.minSpeed) {
    return `Speed ${model.speed} < minimum ${gates.minSpeed}`;
  }

  if (gates.blockLocal && model.provider === 'local') {
    return 'Local models blocked';
  }

  if (gates.blockedProviders && gates.blockedProviders.includes(model.provider)) {
    return `Provider ${model.provider} is blocked`;
  }

  if (gates.maxLatency) {
    const estimatedLatency = (11 - model.speed) * 1000;
    if (estimatedLatency > gates.maxLatency) {
      return `Estimated latency ${estimatedLatency}ms > maximum ${gates.maxLatency}ms`;
    }
  }

  return null;
}
