import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, cleanupTestDb } from '../../helpers/testDb.js';
import { BudgetTracker } from '../../../src/budget/tracker.js';
import { BudgetRepository } from '../../../src/database/repositories/budgets.js';

describe('BudgetTracker', () => {
  let testDb;
  let tracker;
  const mockLogger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} };
  const mockConfig = {
    budget: {
      hard: { daily: 10.00, monthly: 200.00 },
      soft: { daily: 5.00, monthly: 100.00 }
    }
  };

  beforeEach(async () => {
    testDb = await createTestDb();
    tracker = new BudgetTracker(testDb.db, mockConfig, mockLogger);
  });

  afterEach(() => {
    cleanupTestDb(testDb);
  });

  it('should get zero spent for new project', () => {
    const dailySpent = tracker.getDailySpent('test-project');
    const monthlySpent = tracker.getMonthlySpent('test-project');

    expect(dailySpent).toBe(0);
    expect(monthlySpent).toBe(0);
  });

  it('should record usage', () => {
    const status = tracker.recordUsage('test-project', 2.50);

    expect(status.daily.spent).toBe(2.50);
    expect(status.monthly.spent).toBe(2.50);
  });

  it('should accumulate usage', () => {
    tracker.recordUsage('test-project', 2.50);
    tracker.recordUsage('test-project', 1.75);
    const status = tracker.recordUsage('test-project', 0.50);

    expect(status.daily.spent).toBe(4.75);
    expect(status.monthly.spent).toBe(4.75);
  });

  it('should calculate remaining budget', () => {
    tracker.recordUsage('test-project', 3.00);

    const dailyRemaining = tracker.getRemaining('test-project', 'daily');
    const monthlyRemaining = tracker.getRemaining('test-project', 'monthly');

    expect(dailyRemaining).toBe(7.00);
    expect(monthlyRemaining).toBe(197.00);
  });

  it('should get budget status', () => {
    tracker.recordUsage('test-project', 6.00);
    const status = tracker.getStatus('test-project');

    expect(status.daily.spent).toBe(6.00);
    expect(status.daily.limit).toBe(10.00);
    expect(status.daily.remaining).toBe(4.00);
    expect(status.daily.percent).toBe(60);
    expect(status.daily.soft_limit_exceeded).toBe(true);
    expect(status.daily.hard_limit_exceeded).toBe(false);
  });

  it('should detect hard limit exceeded', () => {
    tracker.recordUsage('test-project', 10.00);
    const status = tracker.getStatus('test-project');

    expect(status.daily.hard_limit_exceeded).toBe(true);
  });

  it('should separate projects', () => {
    tracker.recordUsage('project-a', 3.00);
    tracker.recordUsage('project-b', 5.00);

    const statusA = tracker.getStatus('project-a');
    const statusB = tracker.getStatus('project-b');

    expect(statusA.daily.spent).toBe(3.00);
    expect(statusB.daily.spent).toBe(5.00);
  });
});
