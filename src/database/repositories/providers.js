/**
 * Provider repository
 */
export class ProviderRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all providers
   * @param {object} filters - Optional filters
   * @returns {Array} Array of provider objects
   */
  getAll(filters = {}) {
    let query = 'SELECT * FROM providers';
    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name';

    return this.db.prepare(query).all(...params);
  }

  /**
   * Get provider by name
   * @param {string} name - Provider name
   * @returns {object|undefined} Provider object or undefined
   */
  getByName(name) {
    return this.db.prepare('SELECT * FROM providers WHERE name = ?').get(name);
  }

  /**
   * Insert new provider
   * @param {object} provider - Provider data
   * @returns {object} Inserted provider
   */
  insert(provider) {
    const stmt = this.db.prepare(`
      INSERT INTO providers (name, display_name, endpoint, api_key_format, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      provider.name,
      provider.display_name,
      provider.endpoint || null,
      provider.api_key_format || null,
      provider.status || 'active'
    );

    return this.getByName(provider.name);
  }

  /**
   * Update provider
   * @param {string} name - Provider name
   * @param {object} updates - Fields to update
   * @returns {object} Updated provider
   */
  update(name, updates) {
    const fields = [];
    const params = [];

    if (updates.display_name !== undefined) {
      fields.push('display_name = ?');
      params.push(updates.display_name);
    }
    if (updates.endpoint !== undefined) {
      fields.push('endpoint = ?');
      params.push(updates.endpoint);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }

    if (fields.length === 0) {
      return this.getByName(name);
    }

    params.push(name);

    this.db.prepare(`
      UPDATE providers
      SET ${fields.join(', ')}
      WHERE name = ?
    `).run(...params);

    return this.getByName(name);
  }

  /**
   * Delete provider
   * @param {string} name - Provider name
   * @returns {boolean} True if deleted
   */
  delete(name) {
    const result = this.db.prepare('DELETE FROM providers WHERE name = ?').run(name);
    return result.changes > 0;
  }
}
