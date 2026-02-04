import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, cleanupTestDb } from '../../helpers/testDb.js';

describe('ModelRepository', () => {
  let testDb;

  beforeEach(async () => {
    testDb = await createTestDb();
  });

  afterEach(() => {
    cleanupTestDb(testDb);
  });

  it('should get all models', () => {
    const models = testDb.models.getAll();
    expect(models).toHaveLength(2); // claude-haiku + llama
  });

  it('should get model by provider and name', () => {
    const model = testDb.models.get('anthropic', 'claude-haiku-4-5-20251001');
    expect(model).toBeDefined();
    expect(model.intelligence).toBe(7);
  });

  it('should get models by provider', () => {
    const models = testDb.models.getByProvider('anthropic');
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('claude-haiku-4-5-20251001');
  });

  it('should insert new model', () => {
    const newModel = {
      provider: 'anthropic',
      name: 'claude-opus-4',
      intelligence: 10,
      speed: 7,
      context_window: 200000,
      pricing_input: 15.0,
      pricing_output: 75.0,
      free_tier_tokens: null,
      free_tier_period: null
    };

    const inserted = testDb.models.insert(newModel);
    expect(inserted.name).toBe('claude-opus-4');
    expect(inserted.intelligence).toBe(10);
  });

  it('should filter models by minIntelligence', () => {
    const models = testDb.models.getAll({ minIntelligence: 8 });
    expect(models).toHaveLength(0);

    const models2 = testDb.models.getAll({ minIntelligence: 7 });
    expect(models2).toHaveLength(2);
  });

  it('should update model', () => {
    const updated = testDb.models.update('anthropic', 'claude-haiku-4-5-20251001', {
      pricing_input: 0.30
    });

    expect(updated.pricing_input).toBe(0.30);
  });

  it('should delete model', () => {
    const deleted = testDb.models.delete('local', 'llama-3.1-8b');
    expect(deleted).toBe(true);

    const all = testDb.models.getAll();
    expect(all).toHaveLength(1);
  });
});
