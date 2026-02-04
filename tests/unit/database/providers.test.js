import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, cleanupTestDb } from '../../helpers/testDb.js';

describe('ProviderRepository', () => {
  let testDb;

  beforeEach(async () => {
    testDb = await createTestDb();
  });

  afterEach(() => {
    cleanupTestDb(testDb);
  });

  it('should get all providers', () => {
    const providers = testDb.providers.getAll();
    expect(providers).toHaveLength(2); // anthropic + local
    expect(providers[0].name).toBe('anthropic');
  });

  it('should get provider by name', () => {
    const provider = testDb.providers.getByName('anthropic');
    expect(provider).toBeDefined();
    expect(provider.display_name).toBe('Anthropic');
  });

  it('should insert new provider', () => {
    const newProvider = {
      name: 'openai',
      display_name: 'OpenAI',
      endpoint: 'https://api.openai.com',
      status: 'active'
    };

    const inserted = testDb.providers.insert(newProvider);
    expect(inserted.name).toBe('openai');
    expect(inserted.display_name).toBe('OpenAI');

    const all = testDb.providers.getAll();
    expect(all).toHaveLength(3);
  });

  it('should update provider', () => {
    const updated = testDb.providers.update('anthropic', {
      status: 'deprecated'
    });

    expect(updated.status).toBe('deprecated');
  });

  it('should delete provider', () => {
    const deleted = testDb.providers.delete('local');
    expect(deleted).toBe(true);

    const all = testDb.providers.getAll();
    expect(all).toHaveLength(1);
  });

  it('should filter providers by status', () => {
    testDb.providers.update('anthropic', { status: 'deprecated' });

    const active = testDb.providers.getAll({ status: 'active' });
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('local');
  });
});
