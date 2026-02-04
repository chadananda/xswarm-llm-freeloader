import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigLoader } from '../../../src/config/loader.js';
import { DEFAULT_CONFIG } from '../../../src/config/defaults.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ConfigLoader', () => {
  let tempConfigPath;
  let loader;

  beforeEach(() => {
    // Create temp config file
    tempConfigPath = path.join(os.tmpdir(), `xswarm-test-config-${Date.now()}.json`);
    loader = new ConfigLoader(tempConfigPath);
  });

  afterEach(() => {
    // Clean up temp file
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  });

  it('should load default config when no file exists', () => {
    const config = loader.load();
    expect(config.version).toBe('1.0');
    expect(config.routing.strategy).toBe('balanced');
    expect(config.budget.hard.daily).toBe(10.00);
  });

  it('should save and load config', () => {
    const customConfig = {
      ...DEFAULT_CONFIG,
      routing: {
        ...DEFAULT_CONFIG.routing,
        strategy: 'cost-first'
      }
    };

    loader.save(customConfig);
    expect(fs.existsSync(tempConfigPath)).toBe(true);

    const loaded = loader.load();
    expect(loaded.routing.strategy).toBe('cost-first');
  });

  it('should merge user config with defaults', () => {
    // Save partial config
    fs.writeFileSync(tempConfigPath, JSON.stringify({
      routing: {
        strategy: 'speed-first'
      }
    }));

    const loaded = loader.load();
    expect(loaded.routing.strategy).toBe('speed-first');
    expect(loaded.budget.hard.daily).toBe(10.00); // Default value preserved
  });

  it('should get config value by path', () => {
    loader.save(DEFAULT_CONFIG);

    const strategy = loader.get('routing.strategy');
    expect(strategy).toBe('balanced');

    const dailyBudget = loader.get('budget.hard.daily');
    expect(dailyBudget).toBe(10.00);
  });

  it('should set config value by path', () => {
    loader.save(DEFAULT_CONFIG);

    loader.set('routing.strategy', 'quality-first');
    const updated = loader.load();
    expect(updated.routing.strategy).toBe('quality-first');
  });

  it('should update config with partial updates', () => {
    loader.save(DEFAULT_CONFIG);

    const updated = loader.update({
      budget: {
        hard: {
          daily: 20.00
        }
      }
    });

    expect(updated.budget.hard.daily).toBe(20.00);
    expect(updated.budget.hard.monthly).toBe(200.00); // Preserved
  });

  it('should validate config on save', () => {
    const invalidConfig = {
      ...DEFAULT_CONFIG,
      routing: {
        ...DEFAULT_CONFIG.routing,
        strategy: 'invalid-strategy' // Invalid enum value
      }
    };

    expect(() => loader.save(invalidConfig)).toThrow();
  });

  it('should validate weights sum to 1.0', () => {
    const invalidConfig = {
      ...DEFAULT_CONFIG,
      routing: {
        ...DEFAULT_CONFIG.routing,
        weights: {
          cost: 0.5,
          speed: 0.3,
          quality: 0.3 // Sum is 1.1, not 1.0
        }
      }
    };

    expect(() => loader.save(invalidConfig)).toThrow();
  });

  it('should reset to default config', () => {
    loader.save({
      ...DEFAULT_CONFIG,
      routing: {
        ...DEFAULT_CONFIG.routing,
        strategy: 'cost-first'
      }
    });

    loader.reset();

    const loaded = loader.load();
    expect(loaded.routing.strategy).toBe('balanced');
  });

  it('should check if config exists', () => {
    expect(loader.exists()).toBe(false);

    loader.save(DEFAULT_CONFIG);

    expect(loader.exists()).toBe(true);
  });
});
