import { describe, it, expect } from 'vitest';
import { applyQualityGates, getRejectionReason } from '../../../src/routing/qualityGates.js';

describe('Quality Gates', () => {
  const testModels = [
    {
      provider: 'anthropic',
      name: 'claude-haiku',
      intelligence: 7,
      speed: 10,
      pricing_input: 0.25
    },
    {
      provider: 'local',
      name: 'llama-3.1-8b',
      intelligence: 7,
      speed: 5,
      pricing_input: 0.0
    },
    {
      provider: 'openai',
      name: 'gpt-4-turbo',
      intelligence: 9,
      speed: 7,
      pricing_input: 10.0
    }
  ];

  it('should pass all models with no gates', () => {
    const filtered = applyQualityGates(testModels, {});
    expect(filtered).toHaveLength(3);
  });

  it('should filter by minIntelligence', () => {
    const filtered = applyQualityGates(testModels, { minIntelligence: 8 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('gpt-4-turbo');
  });

  it('should filter by minSpeed', () => {
    const filtered = applyQualityGates(testModels, { minSpeed: 7 });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(m => m.name)).toContain('claude-haiku');
    expect(filtered.map(m => m.name)).toContain('gpt-4-turbo');
  });

  it('should block local models', () => {
    const filtered = applyQualityGates(testModels, { blockLocal: true });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(m => m.provider !== 'local')).toBe(true);
  });

  it('should block specific providers', () => {
    const filtered = applyQualityGates(testModels, {
      blockedProviders: ['openai']
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(m => m.provider !== 'openai')).toBe(true);
  });

  it('should apply multiple gates', () => {
    const filtered = applyQualityGates(testModels, {
      minIntelligence: 7,
      minSpeed: 7,
      blockLocal: true
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(m => m.name)).toContain('claude-haiku');
    expect(filtered.map(m => m.name)).toContain('gpt-4-turbo');
  });

  it('should get rejection reason', () => {
    const reason1 = getRejectionReason(testModels[0], { minIntelligence: 8 });
    expect(reason1).toContain('Intelligence');

    const reason2 = getRejectionReason(testModels[1], { blockLocal: true });
    expect(reason2).toContain('Local models blocked');

    const reason3 = getRejectionReason(testModels[2], { blockedProviders: ['openai'] });
    expect(reason3).toContain('blocked');
  });
});
