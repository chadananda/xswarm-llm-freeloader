/**
 * Default configuration for xSwarm-Freeloader
 */

export const DEFAULT_CONFIG = {
  version: '1.0',

  routing: {
    strategy: 'balanced',
    weights: {
      cost: 0.4,
      speed: 0.4,
      quality: 0.2
    },
    qualityGates: {
      minIntelligence: 6,
      maxLatency: 10000,
      blockLocal: false
    }
  },

  budget: {
    hard: {
      daily: 10.00,
      monthly: 200.00
    },
    soft: {
      daily: 5.00,
      monthly: 100.00
    }
  },

  server: {
    port: 3000,
    host: '127.0.0.1',
    litellmPort: 4000
  },

  logging: {
    level: 'info'
  }
};

/**
 * Strategy presets
 */
export const STRATEGY_PRESETS = {
  balanced: {
    cost: 0.4,
    speed: 0.4,
    quality: 0.2
  },
  'cost-first': {
    cost: 0.7,
    speed: 0.2,
    quality: 0.1
  },
  'speed-first': {
    cost: 0.1,
    speed: 0.7,
    quality: 0.2
  },
  'quality-first': {
    cost: 0.1,
    speed: 0.2,
    quality: 0.7
  }
};
