/**
 * Budget repository
 */
export class BudgetRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get budget tracking record
   * @param {string} period - Period string (YYYY-MM-DD or YYYY-MM)
   * @param {string} project - Project name
   * @returns {object|undefined} Budget tracking record or undefined
   */
  get(period, project = 'default') {
    return this.db.prepare(
      'SELECT * FROM budget_tracking WHERE period = ? AND project = ?'
    ).get(period, project);
  }

  /**
   * Get spent amount for period
   * @param {string} period - Period string
   * @param {string} project - Project name
   * @returns {number} Spent amount in USD
   */
  getSpent(period, project = 'default') {
    const record = this.get(period, project);
    return record ? record.spent_usd : 0;
  }

  /**
   * Get remaining budget
   * @param {string} period - Period string
   * @param {string} project - Project name
   * @param {number} limit - Budget limit
   * @returns {number} Remaining budget in USD
   */
  getRemaining(period, project = 'default', limit) {
    const spent = this.getSpent(period, project);
    return Math.max(0, limit - spent);
  }

  /**
   * Increment budget tracking
   * @param {string} period - Period string
   * @param {string} project - Project name
   * @param {number} costUsd - Cost to add
   * @returns {object} Updated budget tracking record
   */
  increment(period, project = 'default', costUsd) {
    const stmt = this.db.prepare(`
      INSERT INTO budget_tracking (period, project, spent_usd, requests)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(period, project) DO UPDATE SET
        spent_usd = spent_usd + excluded.spent_usd,
        requests = requests + excluded.requests
    `);

    stmt.run(period, project, costUsd);

    return this.get(period, project);
  }

  /**
   * Get all budget records for a project
   * @param {string} project - Project name
   * @param {object} options - Options
   * @returns {Array} Array of budget tracking records
   */
  getByProject(project = 'default', options = {}) {
    let query = 'SELECT * FROM budget_tracking WHERE project = ?';
    const params = [project];

    if (options.periodType === 'daily') {
      query += " AND length(period) = 10"; // YYYY-MM-DD
    } else if (options.periodType === 'monthly') {
      query += " AND length(period) = 7"; // YYYY-MM
    }

    query += ' ORDER BY period DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    return this.db.prepare(query).all(...params);
  }

  /**
   * Get today's date string
   * @returns {string} Today's date in YYYY-MM-DD format
   */
  static getTodayString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Get current month string
   * @returns {string} Current month in YYYY-MM format
   */
  static getMonthString() {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  }

  /**
   * Reset budget tracking (for testing)
   * @param {string} period - Period string
   * @param {string} project - Project name
   */
  reset(period, project = 'default') {
    this.db.prepare('DELETE FROM budget_tracking WHERE period = ? AND project = ?')
      .run(period, project);
  }
}
