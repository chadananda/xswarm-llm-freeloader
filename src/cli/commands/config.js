import { ConfigLoader } from '../../config/loader.js';

/**
 * Get config value
 */
export function configGetCommand(key) {
  const loader = new ConfigLoader();

  if (!loader.exists()) {
    console.error('❌ Configuration not found. Run: xswarm init');
    process.exit(1);
  }

  const value = loader.get(key);

  if (value === undefined) {
    console.error(`❌ Key '${key}' not found in configuration`);
    process.exit(1);
  }

  console.log(JSON.stringify(value, null, 2));
}

/**
 * Set config value
 */
export function configSetCommand(options) {
  const loader = new ConfigLoader();

  if (!loader.exists()) {
    console.error('❌ Configuration not found. Run: xswarm init');
    process.exit(1);
  }

  const updates = {};

  if (options.strategy) {
    updates['routing.strategy'] = options.strategy;
  }

  if (options.dailyBudget) {
    updates['budget.hard.daily'] = parseFloat(options.dailyBudget);
  }

  if (options.monthlyBudget) {
    updates['budget.hard.monthly'] = parseFloat(options.monthlyBudget);
  }

  if (Object.keys(updates).length === 0) {
    console.error('❌ No updates specified');
    console.log('\nAvailable options:');
    console.log('  --strategy <balanced|cost-first|speed-first|quality-first>');
    console.log('  --daily-budget <amount>');
    console.log('  --monthly-budget <amount>');
    process.exit(1);
  }

  // Apply updates
  for (const [key, value] of Object.entries(updates)) {
    loader.set(key, value);
    console.log(`✅ Set ${key} = ${JSON.stringify(value)}`);
  }

  console.log('\n⚠️  Note: Restart daemon to apply changes:');
  console.log('   $ xswarm stop && xswarm start --daemon');
}

/**
 * Show config
 */
export function configShowCommand() {
  const loader = new ConfigLoader();

  if (!loader.exists()) {
    console.error('❌ Configuration not found. Run: xswarm init');
    process.exit(1);
  }

  const config = loader.load();

  console.log('📝 Configuration:\n');
  console.log(JSON.stringify(config, null, 2));
  console.log(`\n📍 Location: ${loader.configPath}`);
}
