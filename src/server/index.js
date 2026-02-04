import { createApp } from './app.js';
import { initDatabase, getDefaultDbPath } from '../database/db.js';
import { runMigrations, seedInitialData } from '../database/migrations/migrator.js';
import {
  ProviderRepository,
  ModelRepository,
  AccountRepository,
  UsageRepository,
  BudgetRepository
} from '../database/repositories/index.js';
import { ConfigLoader } from '../config/loader.js';
import { LiteLLMManager } from '../litellm/manager.js';
import { Router } from '../routing/router.js';
import { BudgetTracker } from '../budget/tracker.js';
import { BudgetEnforcer } from '../budget/enforcer.js';
import { getDefaultLogger } from '../utils/logger.js';

/**
 * Start server
 */
export async function start() {
  const logger = getDefaultLogger();

  logger.info('Starting xSwarm-Freeloader server...');

  // Load configuration
  const configLoader = new ConfigLoader();
  const config = configLoader.load();

  logger.info('Configuration loaded');

  // Initialize database
  const dbPath = getDefaultDbPath();
  const db = initDatabase(dbPath);

  await runMigrations(db);
  seedInitialData(db);

  logger.info('Database initialized');

  // Create repositories
  const providers = new ProviderRepository(db);
  const models = new ModelRepository(db);
  const accounts = new AccountRepository(db);
  const usage = new UsageRepository(db);
  const budgets = new BudgetRepository(db);

  const dbContext = { db, providers, models, accounts, usage, budgets };

  // Initialize LiteLLM
  const litellmManager = new LiteLLMManager(db, config, logger);

  // Only start LiteLLM if we have accounts
  const accountsList = accounts.getAll();
  if (accountsList.length > 0) {
    try {
      await litellmManager.start();
      logger.info('LiteLLM started successfully');
    } catch (error) {
      logger.error(`Failed to start LiteLLM: ${error.message}`);
      logger.warn('Server will start without LiteLLM proxy');
    }
  } else {
    logger.warn('No accounts configured, LiteLLM not started');
    logger.info('Add accounts with: xswarm account add <provider> <api-key>');
  }

  // Initialize budget management
  const budgetTracker = new BudgetTracker(db, config, logger);
  const budgetEnforcer = new BudgetEnforcer(budgetTracker, logger);

  // Initialize router
  const litellmClient = litellmManager.getClient();
  const router = new Router(
    dbContext,
    litellmClient,
    budgetEnforcer,
    config,
    logger
  );

  // Create app context
  const appContext = {
    ...dbContext,
    config,
    logger,
    litellmManager,
    budgetTracker,
    budgetEnforcer,
    router
  };

  // Create HTTP server
  const app = createApp(appContext);

  // Register routes
  const { registerRoutes } = await import('./app.js');
  await registerRoutes(app, appContext);

  const port = config.server?.port || 3000;
  const host = config.server?.host || '127.0.0.1';

  try {
    await app.listen({ port, host });
    logger.info(`Server listening on http://${host}:${port}`);
    logger.info('API endpoints:');
    logger.info(`  POST http://${host}:${port}/v1/completions`);
    logger.info(`  GET  http://${host}:${port}/v1/budget`);
    logger.info(`  GET  http://${host}:${port}/v1/models`);
    logger.info(`  GET  http://${host}:${port}/v1/accounts`);
    logger.info(`  GET  http://${host}:${port}/v1/health`);
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');

    try {
      await app.close();
      logger.info('HTTP server closed');
    } catch (error) {
      logger.error(`Error closing HTTP server: ${error.message}`);
    }

    try {
      await litellmManager.stop();
      logger.info('LiteLLM stopped');
    } catch (error) {
      logger.error(`Error stopping LiteLLM: ${error.message}`);
    }

    db.close();
    logger.info('Database closed');

    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
