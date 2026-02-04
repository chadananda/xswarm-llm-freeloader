import Database from 'better-sqlite3';
import { runMigrations, seedInitialData } from '../../src/database/migrations/migrator.js';
import {
  ProviderRepository,
  ModelRepository,
  AccountRepository,
  UsageRepository,
  BudgetRepository
} from '../../src/database/repositories/index.js';

/**
 * Create in-memory test database
 * @returns {object} Database and repositories
 */
export async function createTestDb() {
  const db = new Database(':memory:');

  // Run migrations
  await runMigrations(db);

  // Seed initial data
  seedInitialData(db);

  // Create repositories
  const providers = new ProviderRepository(db);
  const models = new ModelRepository(db);
  const accounts = new AccountRepository(db);
  const usage = new UsageRepository(db);
  const budgets = new BudgetRepository(db);

  return {
    db,
    providers,
    models,
    accounts,
    usage,
    budgets,
    close: () => db.close()
  };
}

/**
 * Clean up test database
 * @param {object} testDb - Test database object
 */
export function cleanupTestDb(testDb) {
  if (testDb && testDb.db && testDb.db.open) {
    testDb.db.close();
  }
}
