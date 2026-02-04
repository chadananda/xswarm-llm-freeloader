import fs from 'fs';
import path from 'path';
import { DEFAULT_CONFIG } from './defaults.js';
import { validateConfig } from './schema.js';

/**
 * Configuration loader
 */
export class ConfigLoader {
  constructor(configPath = null) {
    this.configPath = configPath || this.getDefaultConfigPath();
  }

  /**
   * Get default config path
   * @returns {string} Path to ~/.xswarm/config.json
   */
  getDefaultConfigPath() {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    return path.join(homeDir, '.xswarm', 'config.json');
  }

  /**
   * Load configuration
   * @returns {object} Loaded and validated configuration
   */
  load() {
    // Start with default config
    let config = { ...DEFAULT_CONFIG };

    // Try to load user config
    if (fs.existsSync(this.configPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        config = this.merge(config, userConfig);
      } catch (error) {
        throw new Error(`Failed to load config from ${this.configPath}: ${error.message}`);
      }
    }

    // Validate merged config
    try {
      return validateConfig(config);
    } catch (error) {
      throw new Error(`Invalid configuration: ${error.message}`);
    }
  }

  /**
   * Save configuration
   * @param {object} config - Configuration to save
   */
  save(config) {
    // Validate before saving
    const validatedConfig = validateConfig(config);

    // Ensure directory exists
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write config file
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(validatedConfig, null, 2),
      'utf8'
    );
  }

  /**
   * Update configuration
   * @param {object} updates - Configuration updates (partial)
   * @returns {object} Updated configuration
   */
  update(updates) {
    const current = this.load();
    const updated = this.merge(current, updates);
    this.save(updated);
    return updated;
  }

  /**
   * Deep merge objects
   * @param {object} target - Target object
   * @param {object} source - Source object
   * @returns {object} Merged object
   */
  merge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.merge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Get config value by path
   * @param {string} keyPath - Dot-separated key path (e.g., 'routing.strategy')
   * @returns {any} Config value
   */
  get(keyPath) {
    const config = this.load();
    const keys = keyPath.split('.');
    let value = config;

    for (const key of keys) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  /**
   * Set config value by path
   * @param {string} keyPath - Dot-separated key path
   * @param {any} value - Value to set
   * @returns {object} Updated configuration
   */
  set(keyPath, value) {
    const config = this.load();
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    let target = config;

    for (const key of keys) {
      if (target[key] === undefined || target[key] === null) {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;

    this.save(config);
    return config;
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.save(DEFAULT_CONFIG);
  }

  /**
   * Check if config file exists
   * @returns {boolean}
   */
  exists() {
    return fs.existsSync(this.configPath);
  }
}
