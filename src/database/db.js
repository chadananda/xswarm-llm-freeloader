import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Initialize database connection
 * @param {string} dbPath - Path to SQLite database file
 * @param {object} options - Database options
 * @returns {Database} - better-sqlite3 database instance
 */
export function initDatabase(dbPath, options = {}) {
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create database connection
  const db = new Database(dbPath, {
    verbose: options.verbose ? console.log : undefined,
    ...options
  });

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Get default database path
 * @returns {string} - Path to ~/.xswarm/freeloader.db
 */
export function getDefaultDbPath() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  return path.join(homeDir, '.xswarm', 'freeloader.db');
}

/**
 * Close database connection
 * @param {Database} db - Database instance to close
 */
export function closeDatabase(db) {
  if (db && db.open) {
    db.close();
  }
}

/**
 * Create in-memory database for testing
 * @returns {Database} - In-memory database instance
 */
export function createTestDatabase() {
  return new Database(':memory:', {
    verbose: process.env.DEBUG ? console.log : undefined
  });
}
