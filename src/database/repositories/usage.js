/**
 * Usage repository
 */
export class UsageRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Log a request
   * @param {object} usage - Usage data
   * @returns {object} Inserted usage record
   */
  log(usage) {
    const stmt = this.db.prepare(`
      INSERT INTO usage (
        timestamp, provider, model, project,
        tokens_in, tokens_out, cost_usd, latency_ms,
        success, routing_reason, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      usage.timestamp || Math.floor(Date.now() / 1000),
      usage.provider,
      usage.model,
      usage.project || 'default',
      usage.tokens_in,
      usage.tokens_out,
      usage.cost_usd,
      usage.latency_ms,
      usage.success ? 1 : 0,
      usage.routing_reason || null,
      usage.error_message || null
    );

    return this.db.prepare('SELECT * FROM usage WHERE id = ?').get(result.lastInsertRowid);
  }

  /**
   * Get usage by period
   * @param {string} period - Period ('today', 'this_month', or ISO date/month)
   * @param {object} filters - Optional filters
   * @returns {Array} Array of usage records
   */
  getByPeriod(period, filters = {}) {
    const now = new Date();
    let startTimestamp, endTimestamp;

    if (period === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startTimestamp = Math.floor(today.getTime() / 1000);
      endTimestamp = Math.floor(Date.now() / 1000);
    } else if (period === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startTimestamp = Math.floor(monthStart.getTime() / 1000);
      endTimestamp = Math.floor(Date.now() / 1000);
    } else if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Specific date (YYYY-MM-DD)
      const date = new Date(period);
      startTimestamp = Math.floor(date.getTime() / 1000);
      endTimestamp = startTimestamp + 86400; // +24 hours
    } else if (period.match(/^\d{4}-\d{2}$/)) {
      // Specific month (YYYY-MM)
      const [year, month] = period.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 1);
      startTimestamp = Math.floor(monthStart.getTime() / 1000);
      endTimestamp = Math.floor(monthEnd.getTime() / 1000);
    } else {
      throw new Error(`Invalid period format: ${period}`);
    }

    let query = 'SELECT * FROM usage WHERE timestamp >= ? AND timestamp < ?';
    const params = [startTimestamp, endTimestamp];

    if (filters.project) {
      query += ' AND project = ?';
      params.push(filters.project);
    }

    if (filters.provider) {
      query += ' AND provider = ?';
      params.push(filters.provider);
    }

    if (filters.success !== undefined) {
      query += ' AND success = ?';
      params.push(filters.success ? 1 : 0);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.db.prepare(query).all(...params);
  }

  /**
   * Get usage statistics by period
   * @param {string} period - Period identifier
   * @param {object} filters - Optional filters
   * @returns {object} Statistics object
   */
  getStats(period, filters = {}) {
    const records = this.getByPeriod(period, filters);

    return {
      total_requests: records.length,
      successful_requests: records.filter(r => r.success).length,
      failed_requests: records.filter(r => !r.success).length,
      total_tokens_in: records.reduce((sum, r) => sum + r.tokens_in, 0),
      total_tokens_out: records.reduce((sum, r) => sum + r.tokens_out, 0),
      total_cost: records.reduce((sum, r) => sum + r.cost_usd, 0),
      avg_latency: records.length > 0
        ? records.reduce((sum, r) => sum + r.latency_ms, 0) / records.length
        : 0,
      by_provider: this._groupByProvider(records)
    };
  }

  /**
   * Group usage records by provider
   * @private
   */
  _groupByProvider(records) {
    const grouped = {};

    for (const record of records) {
      if (!grouped[record.provider]) {
        grouped[record.provider] = {
          requests: 0,
          cost: 0,
          tokens_in: 0,
          tokens_out: 0
        };
      }

      grouped[record.provider].requests++;
      grouped[record.provider].cost += record.cost_usd;
      grouped[record.provider].tokens_in += record.tokens_in;
      grouped[record.provider].tokens_out += record.tokens_out;
    }

    return grouped;
  }

  /**
   * Delete old usage records
   * @param {number} olderThanDays - Delete records older than N days
   * @returns {number} Number of deleted records
   */
  deleteOld(olderThanDays) {
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (olderThanDays * 86400);
    const result = this.db.prepare('DELETE FROM usage WHERE timestamp < ?').run(cutoffTimestamp);
    return result.changes;
  }
}
