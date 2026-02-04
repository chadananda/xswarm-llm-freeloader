import fs from 'fs';
import path from 'path';
import { initDatabase, getDefaultDbPath } from '../../database/db.js';
import { runMigrations, seedInitialData } from '../../database/migrations/migrator.js';
import { ConfigLoader } from '../../config/loader.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

/**
 * Initialize xSwarm-Freeloader
 */
export async function initCommand() {
  console.log('🚀 Initializing xSwarm-Freeloader...\n');

  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const xswarmDir = path.join(homeDir, '.xswarm');

  // Create directories
  console.log('📁 Creating directories...');
  fs.mkdirSync(xswarmDir, { recursive: true });
  fs.mkdirSync(path.join(xswarmDir, 'logs'), { recursive: true });

  // Initialize database
  console.log('💾 Initializing database...');
  const dbPath = getDefaultDbPath();
  const db = initDatabase(dbPath);

  await runMigrations(db);
  seedInitialData(db);

  db.close();

  console.log('✅ Database initialized');

  // Create default configuration
  console.log('⚙️  Creating configuration...');
  const configLoader = new ConfigLoader();

  if (!configLoader.exists()) {
    configLoader.save(DEFAULT_CONFIG);
    console.log('✅ Configuration created');
  } else {
    console.log('ℹ️  Configuration already exists, skipping');
  }

  console.log('\n✅ xSwarm-Freeloader initialized successfully!\n');
  console.log('📍 Installation directory: ' + xswarmDir);
  console.log('📍 Configuration: ' + configLoader.configPath);
  console.log('📍 Database: ' + dbPath);
  console.log('📍 Logs: ' + path.join(xswarmDir, 'logs'));

  console.log('\n📝 Next steps:\n');
  console.log('  1. Add API keys:');
  console.log('     $ xswarm account add anthropic sk-ant-api03-xxxxx\n');
  console.log('  2. Start the daemon:');
  console.log('     $ xswarm start --daemon\n');
  console.log('  3. Check status:');
  console.log('     $ xswarm status\n');
  console.log('  4. Make a request:');
  console.log('     $ curl -X POST http://localhost:3000/v1/completions \\');
  console.log('       -H "Content-Type: application/json" \\');
  console.log('       -d \'{"prompt": "Hello!", "strategy": "balanced"}\'\n');
}
