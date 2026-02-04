import { initDatabase, getDefaultDbPath } from '../../database/db.js';
import { AccountRepository, ProviderRepository } from '../../database/repositories/index.js';

/**
 * Add account
 */
export async function accountAddCommand(provider, apiKey, options) {
  const db = initDatabase(getDefaultDbPath());
  const accounts = new AccountRepository(db);
  const providers = new ProviderRepository(db);

  // Check if provider exists
  const providerRecord = providers.getByName(provider);
  if (!providerRecord) {
    console.error(`❌ Provider '${provider}' not found`);
    console.log('\nAvailable providers:');
    providers.getAll().forEach(p => {
      console.log(`  - ${p.name} (${p.display_name})`);
    });
    db.close();
    process.exit(1);
  }

  // Add account
  try {
    const account = accounts.insert({
      provider,
      api_key: apiKey,
      tier: options.tier || 'free',
      priority: options.priority || 0
    });

    console.log(`✅ Account added successfully`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Index: ${account.idx}`);
    console.log(`   Tier: ${account.tier}`);
    console.log(`   Status: ${account.status}`);

    console.log('\n⚠️  Note: Restart daemon to apply changes:');
    console.log('   $ xswarm stop && xswarm start --daemon');
  } catch (error) {
    console.error(`❌ Failed to add account: ${error.message}`);
    process.exit(1);
  } finally {
    db.close();
  }
}

/**
 * List accounts
 */
export async function accountListCommand() {
  const db = initDatabase(getDefaultDbPath());
  const accounts = new AccountRepository(db);

  const accountsList = accounts.getAll();

  if (accountsList.length === 0) {
    console.log('No accounts configured');
    console.log('\nTo add an account:');
    console.log('  $ xswarm account add anthropic sk-ant-api03-xxxxx');
    db.close();
    return;
  }

  console.log(`📋 Accounts (${accountsList.length}):\n`);

  accountsList.forEach(acc => {
    const maskedKey = `${acc.api_key.slice(0, 10)}...${acc.api_key.slice(-4)}`;
    console.log(`${acc.provider}[${acc.idx}]:`);
    console.log(`  API Key: ${maskedKey}`);
    console.log(`  Tier: ${acc.tier}`);
    console.log(`  Priority: ${acc.priority}`);
    console.log(`  Status: ${acc.status}`);
    console.log('');
  });

  db.close();
}
