import { describe, it, expect } from 'vitest';
import { scoreModel, calculateBenchmarks, scoreModels } from '../../../src/routing/scorer.js';

describe('Model Scorer', () => {
  const testModels = [
    {
      provider: 'anthropic',
      name: 'claude-haiku',
      intelligence: 7,
      speed: 10,
      pricing_input: 0.25,
      pricing_output: 1.25
    },
    {
      provider: 'local',
      name: 'llama',
      intelligence: 7,
      speed: 5,
      pricing_input: 0.0,
      pricing_output: 0.0
    },
    {
      provider: 'openai',
      name: 'gpt-4',
      intelligence: 10,
      speed: 7,
      pricing_input: 15.0,
      pricing_output: 75.0
    }
  ];

  it('should calculate benchmarks', () => {
    const benchmarks = calculateBenchmarks(testModels);
    expect(benchmarks.maxCost).toBe(15.0);
    expect(benchmarks.maxSpeed).toBe(10);
    expect(benchmarks.maxIntelligence).toBe(10);
  });

  it('should score free model highest with cost-first weights', () => {
    const weights = { cost: 1.0, speed: 0.0, quality: 0.0 };
    const benchmarks = calculateBenchmarks(testModels);

    const scores = testModels.map(m => scoreModel(m, weights, benchmarks));

    // Local (free) should have highest cost score
    expect(scores[1]).toBe(1.0);
    expect(scores[1]).toBeGreaterThan(scores[0]);
    expect(scores[1]).toBeGreaterThan(scores[2]);
  });

  it('should score fastest model highest with speed-first weights', () => {
    const weights = { cost: 0.0, speed: 1.0, quality: 0.0 };
    const benchmarks = calculateBenchmarks(testModels);

    const scores = testModels.map(m => scoreModel(m, weights, benchmarks));

    // Claude Haiku (speed 10) should have highest speed score
    expect(scores[0]).toBe(1.0);
    expect(scores[0]).toBeGreaterThan(scores[1]);
    expect(scores[0]).toBeGreaterThan(scores[2]);
  });

  it('should score smartest model highest with quality-first weights', () => {
    const weights = { cost: 0.0, speed: 0.0, quality: 1.0 };
    const benchmarks = calculateBenchmarks(testModels);

    const scores = testModels.map(m => scoreModel(m, weights, benchmarks));

    // GPT-4 (intelligence 10) should have highest quality score
    expect(scores[2]).toBe(1.0);
    expect(scores[2]).toBeGreaterThan(scores[0]);
    expect(scores[2]).toBeGreaterThan(scores[1]);
  });

  it('should score models with balanced weights', () => {
    const weights = { cost: 0.4, speed: 0.4, quality: 0.2 };
    const scored = scoreModels(testModels, weights);

    expect(scored).toHaveLength(3);
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
    expect(scored[1].score).toBeGreaterThan(scored[2].score);
  });

  it('should include scoring breakdown', () => {
    const weights = { cost: 0.4, speed: 0.4, quality: 0.2 };
    const scored = scoreModels(testModels, weights);

    expect(scored[0].scoring_breakdown).toBeDefined();
    expect(scored[0].scoring_breakdown.cost).toBeGreaterThanOrEqual(0);
    expect(scored[0].scoring_breakdown.speed).toBeGreaterThanOrEqual(0);
    expect(scored[0].scoring_breakdown.quality).toBeGreaterThanOrEqual(0);
  });
});
