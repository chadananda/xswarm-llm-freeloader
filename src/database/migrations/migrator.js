import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run database migrations
 * @param {Database} db - better-sqlite3 database instance
 * @returns {Promise<void>}
 */
export async function runMigrations(db) {
  // Get current schema version
  const currentVersion = db.pragma('user_version', { simple: true });

  // Get all migration files
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Current schema version: ${currentVersion}`);
  console.log(`Found ${files.length} migration files`);

  // Apply migrations in transaction
  for (let i = 0; i < files.length; i++) {
    const targetVersion = i + 1;

    if (currentVersion >= targetVersion) {
      continue; // Already applied
    }

    const file = files[i];
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Applying migration ${file}...`);

    try {
      db.exec('BEGIN TRANSACTION');

      // Execute migration SQL
      db.exec(sql);

      // Update schema version
      db.pragma(`user_version = ${targetVersion}`);

      db.exec('COMMIT');

      console.log(`✓ Migration ${file} applied successfully`);
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${error.message}`);
    }
  }

  const finalVersion = db.pragma('user_version', { simple: true });
  console.log(`Database migrated to version ${finalVersion}`);
}

/**
 * Seed initial data
 * @param {Database} db - better-sqlite3 database instance
 */
export function seedInitialData(db) {
  console.log('Seeding initial provider data...');

  // Check if already seeded
  const existingProviders = db.prepare('SELECT COUNT(*) as count FROM providers').get();
  if (existingProviders.count > 0) {
    console.log('Data already seeded, skipping');
    return;
  }

  // Seed Anthropic provider
  db.prepare(`
    INSERT INTO providers (name, display_name, endpoint, api_key_format, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'anthropic',
    'Anthropic',
    'https://api.anthropic.com',
    'sk-ant-api03-[a-zA-Z0-9]{95}',
    'active'
  );

  // Seed Claude Haiku model
  db.prepare(`
    INSERT INTO models (
      provider, name, intelligence, speed, context_window,
      pricing_input, pricing_output, free_tier_tokens, free_tier_period
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'anthropic',
    'claude-haiku-4-5-20251001',
    7,
    10,
    200000,
    0.25,
    1.25,
    50000,
    'daily'
  );

  // Seed local Ollama provider
  db.prepare(`
    INSERT INTO providers (name, display_name, endpoint, status)
    VALUES (?, ?, ?, ?)
  `).run(
    'local',
    'Ollama (Local)',
    'http://localhost:11434',
    'active'
  );

  // Seed Llama model
  db.prepare(`
    INSERT INTO models (
      provider, name, intelligence, speed, context_window,
      pricing_input, pricing_output, free_tier_tokens, free_tier_period
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'local',
    'llama-3.1-8b',
    7,
    5,
    128000,
    0.0,
    0.0,
    -1,
    'unlimited'
  );

  console.log('✓ Initial data seeded');
}
