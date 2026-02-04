/**
 * Model repository
 */
export class ModelRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all models
   * @param {object} filters - Optional filters
   * @returns {Array} Array of model objects
   */
  getAll(filters = {}) {
    let query = 'SELECT * FROM models';
    const conditions = [];
    const params = [];

    if (filters.provider) {
      conditions.push('provider = ?');
      params.push(filters.provider);
    }

    if (filters.minIntelligence) {
      conditions.push('intelligence >= ?');
      params.push(filters.minIntelligence);
    }

    if (filters.minSpeed) {
      conditions.push('speed >= ?');
      params.push(filters.minSpeed);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY intelligence DESC, speed DESC';

    return this.db.prepare(query).all(...params);
  }

  /**
   * Get model by provider and name
   * @param {string} provider - Provider name
   * @param {string} name - Model name
   * @returns {object|undefined} Model object or undefined
   */
  get(provider, name) {
    return this.db.prepare('SELECT * FROM models WHERE provider = ? AND name = ?').get(provider, name);
  }

  /**
   * Get models by provider
   * @param {string} provider - Provider name
   * @returns {Array} Array of model objects
   */
  getByProvider(provider) {
    return this.db.prepare('SELECT * FROM models WHERE provider = ? ORDER BY intelligence DESC, speed DESC').all(provider);
  }

  /**
   * Insert new model
   * @param {object} model - Model data
   * @returns {object} Inserted model
   */
  insert(model) {
    const stmt = this.db.prepare(`
      INSERT INTO models (
        provider, name, intelligence, speed, context_window,
        pricing_input, pricing_output, free_tier_tokens, free_tier_period
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      model.provider,
      model.name,
      model.intelligence,
      model.speed,
      model.context_window,
      model.pricing_input,
      model.pricing_output,
      model.free_tier_tokens || null,
      model.free_tier_period || null
    );

    return this.get(model.provider, model.name);
  }

  /**
   * Update model
   * @param {string} provider - Provider name
   * @param {string} name - Model name
   * @param {object} updates - Fields to update
   * @returns {object} Updated model
   */
  update(provider, name, updates) {
    const fields = [];
    const params = [];

    const allowedFields = [
      'intelligence', 'speed', 'context_window',
      'pricing_input', 'pricing_output', 'free_tier_tokens', 'free_tier_period'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    if (fields.length === 0) {
      return this.get(provider, name);
    }

    params.push(provider, name);

    this.db.prepare(`
      UPDATE models
      SET ${fields.join(', ')}
      WHERE provider = ? AND name = ?
    `).run(...params);

    return this.get(provider, name);
  }

  /**
   * Delete model
   * @param {string} provider - Provider name
   * @param {string} name - Model name
   * @returns {boolean} True if deleted
   */
  delete(provider, name) {
    const result = this.db.prepare('DELETE FROM models WHERE provider = ? AND name = ?').run(provider, name);
    return result.changes > 0;
  }
}
