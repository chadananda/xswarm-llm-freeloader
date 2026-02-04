import { BudgetExceededError } from '../utils/errors.js';

/**
 * Budget enforcer
 */
export class BudgetEnforcer {
  constructor(tracker, logger) {
    this.tracker = tracker;
    this.logger = logger;
  }

  /**
   * Check budget before making request
   * @param {string} project - Project name
   * @param {number} estimatedCost - Estimated cost in USD
   * @throws {BudgetExceededError} If budget exceeded
   */
  checkBudget(project = 'default', estimatedCost = 0) {
    const status = this.tracker.getStatus(project);

    // Check daily hard limit
    if (status.daily.spent + estimatedCost >= status.daily.limit) {
      throw new BudgetExceededError(
        `Daily budget exceeded for project ${project}`,
        'daily',
        status.daily.spent,
        status.daily.limit
      );
    }

    // Check monthly hard limit
    if (status.monthly.spent + estimatedCost >= status.monthly.limit) {
      throw new BudgetExceededError(
        `Monthly budget exceeded for project ${project}`,
        'monthly',
        status.monthly.spent,
        status.monthly.limit
      );
    }

    // Warn on soft limits
    if (status.daily.soft_limit_exceeded) {
      this.logger.warn(
        `Soft daily budget limit exceeded for project ${project}: ` +
        `$${status.daily.spent.toFixed(2)} / $${status.daily.limit.toFixed(2)}`
      );
    }

    if (status.monthly.soft_limit_exceeded) {
      this.logger.warn(
        `Soft monthly budget limit exceeded for project ${project}: ` +
        `$${status.monthly.spent.toFixed(2)} / $${status.monthly.limit.toFixed(2)}`
      );
    }
  }

  /**
   * Record usage and update budget
   * @param {string} project - Project name
   * @param {number} costUsd - Actual cost in USD
   * @returns {object} Updated budget status
   */
  recordUsage(project = 'default', costUsd) {
    return this.tracker.recordUsage(project, costUsd);
  }
}
