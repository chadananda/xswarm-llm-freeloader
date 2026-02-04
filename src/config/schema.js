import { z } from 'zod';

/**
 * Configuration validation schemas using Zod
 */

export const RoutingStrategySchema = z.enum([
  'balanced',
  'cost-first',
  'speed-first',
  'quality-first'
]);

export const WeightsSchema = z.object({
  cost: z.number().min(0).max(1),
  speed: z.number().min(0).max(1),
  quality: z.number().min(0).max(1)
}).refine(
  (weights) => Math.abs(weights.cost + weights.speed + weights.quality - 1.0) < 0.01,
  { message: 'Weights must sum to 1.0' }
);

export const QualityGatesSchema = z.object({
  minIntelligence: z.number().min(1).max(10).default(6),
  minSpeed: z.number().min(1).max(10).optional(),
  maxLatency: z.number().min(0).default(10000),
  blockLocal: z.boolean().default(false),
  blockedProviders: z.array(z.string()).optional()
});

export const RoutingConfigSchema = z.object({
  strategy: RoutingStrategySchema.default('balanced'),
  weights: WeightsSchema.default({
    cost: 0.4,
    speed: 0.4,
    quality: 0.2
  }),
  qualityGates: QualityGatesSchema.default({
    minIntelligence: 6,
    maxLatency: 10000,
    blockLocal: false
  })
});

export const BudgetLimitSchema = z.object({
  daily: z.number().min(0),
  monthly: z.number().min(0)
});

export const BudgetConfigSchema = z.object({
  hard: BudgetLimitSchema.default({
    daily: 10.00,
    monthly: 200.00
  }),
  soft: BudgetLimitSchema.default({
    daily: 5.00,
    monthly: 100.00
  })
});

export const ServerConfigSchema = z.object({
  port: z.number().min(1024).max(65535).default(3000),
  host: z.string().default('127.0.0.1'),
  litellmPort: z.number().min(1024).max(65535).default(4000)
});

export const LoggingConfigSchema = z.object({
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  file: z.string().optional()
});

export const ConfigSchema = z.object({
  version: z.string().default('1.0'),
  routing: RoutingConfigSchema,
  budget: BudgetConfigSchema,
  server: ServerConfigSchema.optional(),
  logging: LoggingConfigSchema.optional()
});

/**
 * Validate configuration object
 * @param {object} config - Configuration to validate
 * @returns {object} Validated configuration
 * @throws {Error} If validation fails
 */
export function validateConfig(config) {
  return ConfigSchema.parse(config);
}

/**
 * Validate partial configuration (for updates)
 * @param {object} config - Partial configuration to validate
 * @returns {object} Validated partial configuration
 */
export function validatePartialConfig(config) {
  return ConfigSchema.partial().parse(config);
}
