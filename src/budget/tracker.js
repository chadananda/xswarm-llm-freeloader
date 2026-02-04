import { BudgetRepository } from '../database/repositories/index.js';

/**
 * Budget tracker
 */
export class BudgetTracker {
  constructor(db, config, logger) {
    this.budgets = new BudgetRepository(db);
    this.config = config;
    this.logger = logger;
  }

  /**
   * Get daily spent amount
   * @param {string} project - Project name
   * @returns {number} Spent amount in USD
   */
  getDailySpent(project = 'default') {
    const today = BudgetRepository.getTodayString();
    return this.budgets.getSpent(today, project);
  }

  /**
   * Get monthly spent amount
   * @param {string} project - Project name
   * @returns {number} Spent amount in USD
   */
  getMonthlySpent(project = 'default') {
    const month = BudgetRepository.getMonthString();
    return this.budgets.getSpent(month, project);
  }

  /**
   * Get remaining budget
   * @param {string} project - Project name
   * @param {string} period - 'daily' or 'monthly'
   * @returns {number} Remaining budget in USD
   */
  getRemaining(project = 'default', period = 'daily') {
    const periodString = period === 'daily'
      ? BudgetRepository.getTodayString()
      : BudgetRepository.getMonthString();

    const limit = this.config.budget.hard[period];
    return this.budgets.getRemaining(periodString, project, limit);
  }

  /**
   * Get budget status
   * @param {string} project - Project name
   * @returns {object} Budget status
   */
  getStatus(project = 'default') {
    const dailySpent = this.getDailySpent(project);
    const monthlySpent = this.getMonthlySpent(project);

    const dailyLimit = this.config.budget.hard.daily;
    const monthlyLimit = this.config.budget.hard.monthly;

    const dailySoftLimit = this.config.budget.soft.daily;
    const monthlySoftLimit = this.config.budget.soft.monthly;

    return {
      daily: {
        spent: dailySpent,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - dailySpent),
        percent: (dailySpent / dailyLimit) * 100,
        soft_limit_exceeded: dailySpent > dailySoftLimit,
        hard_limit_exceeded: dailySpent >= dailyLimit
      },
      monthly: {
        spent: monthlySpent,
        limit: monthlyLimit,
        remaining: Math.max(0, monthlyLimit - monthlySpent),
        percent: (monthlySpent / monthlyLimit) * 100,
        soft_limit_exceeded: monthlySpent > monthlySoftLimit,
        hard_limit_exceeded: monthlySpent >= monthlyLimit
      }
    };
  }

  /**
   * Record usage
   * @param {string} project - Project name
   * @param {number} costUsd - Cost in USD
   * @returns {object} Updated budget status
   */
  recordUsage(project = 'default', costUsd) {
    const today = BudgetRepository.getTodayString();
    const month = BudgetRepository.getMonthString();

    this.budgets.increment(today, project, costUsd);
    this.budgets.increment(month, project, costUsd);

    this.logger.debug(`Recorded $${costUsd.toFixed(4)} for project ${project}`);

    return this.getStatus(project);
  }
}
