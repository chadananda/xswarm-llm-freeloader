import crypto from 'crypto';

/**
 * Get encryption key from machine ID or environment
 * @returns {Buffer} - 32-byte encryption key
 */
function getEncryptionKey() {
  // Use environment variable or generate from machine-specific data
  const keySource = process.env.XSWARM_ENCRYPTION_KEY ||
                   `${process.env.HOME}-${process.platform}-xswarm`;

  return crypto.createHash('sha256').update(keySource).digest();
}

/**
 * Encrypt API key
 * @param {string} apiKey - Plain text API key
 * @returns {string} - Encrypted key (format: iv:encrypted)
 */
function encryptApiKey(apiKey) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypt API key
 * @param {string} encryptedKey - Encrypted key (format: iv:encrypted:authTag)
 * @returns {string} - Plain text API key
 */
function decryptApiKey(encryptedKey) {
  const key = getEncryptionKey();
  const [ivHex, encrypted, authTagHex] = encryptedKey.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Account repository
 */
export class AccountRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all accounts
   * @param {object} filters - Optional filters
   * @returns {Array} Array of account objects (with decrypted API keys)
   */
  getAll(filters = {}) {
    let query = 'SELECT * FROM accounts';
    const conditions = [];
    const params = [];

    if (filters.provider) {
      conditions.push('provider = ?');
      params.push(filters.provider);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY provider, priority DESC, idx';

    const accounts = this.db.prepare(query).all(...params);

    // Decrypt API keys
    return accounts.map(acc => ({
      ...acc,
      api_key: decryptApiKey(acc.api_key)
    }));
  }

  /**
   * Get account by provider and index
   * @param {string} provider - Provider name
   * @param {number} idx - Account index
   * @returns {object|undefined} Account object or undefined
   */
  get(provider, idx) {
    const account = this.db.prepare('SELECT * FROM accounts WHERE provider = ? AND idx = ?').get(provider, idx);

    if (!account) return undefined;

    return {
      ...account,
      api_key: decryptApiKey(account.api_key)
    };
  }

  /**
   * Get accounts by provider
   * @param {string} provider - Provider name
   * @returns {Array} Array of account objects
   */
  getByProvider(provider) {
    const accounts = this.db.prepare(
      'SELECT * FROM accounts WHERE provider = ? ORDER BY priority DESC, idx'
    ).all(provider);

    return accounts.map(acc => ({
      ...acc,
      api_key: decryptApiKey(acc.api_key)
    }));
  }

  /**
   * Insert new account
   * @param {object} account - Account data
   * @returns {object} Inserted account
   */
  insert(account) {
    // Get next index for this provider
    const maxIdx = this.db.prepare(
      'SELECT COALESCE(MAX(idx), -1) as max_idx FROM accounts WHERE provider = ?'
    ).get(account.provider);

    const idx = maxIdx.max_idx + 1;

    // Encrypt API key
    const encryptedKey = encryptApiKey(account.api_key);

    const stmt = this.db.prepare(`
      INSERT INTO accounts (provider, idx, api_key, tier, priority, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      account.provider,
      idx,
      encryptedKey,
      account.tier || 'free',
      account.priority || 0,
      account.status || 'active'
    );

    return this.get(account.provider, idx);
  }

  /**
   * Update account
   * @param {string} provider - Provider name
   * @param {number} idx - Account index
   * @param {object} updates - Fields to update
   * @returns {object} Updated account
   */
  update(provider, idx, updates) {
    const fields = [];
    const params = [];

    if (updates.api_key !== undefined) {
      fields.push('api_key = ?');
      params.push(encryptApiKey(updates.api_key));
    }
    if (updates.tier !== undefined) {
      fields.push('tier = ?');
      params.push(updates.tier);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      params.push(updates.priority);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    if (updates.last_used !== undefined) {
      fields.push('last_used = ?');
      params.push(updates.last_used);
    }

    if (fields.length === 0) {
      return this.get(provider, idx);
    }

    params.push(provider, idx);

    this.db.prepare(`
      UPDATE accounts
      SET ${fields.join(', ')}
      WHERE provider = ? AND idx = ?
    `).run(...params);

    return this.get(provider, idx);
  }

  /**
   * Delete account
   * @param {string} provider - Provider name
   * @param {number} idx - Account index
   * @returns {boolean} True if deleted
   */
  delete(provider, idx) {
    const result = this.db.prepare('DELETE FROM accounts WHERE provider = ? AND idx = ?').run(provider, idx);
    return result.changes > 0;
  }
}
