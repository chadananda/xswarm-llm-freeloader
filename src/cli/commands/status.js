import { DaemonController } from '../../daemon/controller.js';
import { request } from 'undici';

/**
 * Get daemon status
 */
export async function statusCommand() {
  const controller = new DaemonController(console);
  const status = controller.getStatus();

  if (!status.running) {
    console.log('❌ Daemon not running');
    console.log('\nTo start daemon: xswarm start --daemon');
    process.exit(1);
  }

  console.log('✅ xSwarm-Freeloader daemon running\n');
  console.log(`PID: ${status.pid}`);

  // Try to fetch health information
  try {
    const { statusCode, body } = await request('http://localhost:3000/v1/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (statusCode === 200) {
      const health = await body.json();

      console.log('\n📊 Health Information:');
      console.log(`   Database: ${health.database.providers} providers, ${health.database.models} models, ${health.database.accounts} accounts`);
      console.log(`   LiteLLM: ${health.litellm.running ? '✅ Running' : '❌ Not running'}`);
      console.log(`   Budget (daily): $${health.budget.daily.spent.toFixed(2)} / $${health.budget.daily.limit.toFixed(2)} (${((health.budget.daily.spent / health.budget.daily.limit) * 100).toFixed(1)}%)`);
      console.log(`   Budget (monthly): $${health.budget.monthly.spent.toFixed(2)} / $${health.budget.monthly.limit.toFixed(2)} (${((health.budget.monthly.spent / health.budget.monthly.limit) * 100).toFixed(1)}%)`);
    }
  } catch (error) {
    console.log('\n⚠️  Could not fetch health information');
  }

  console.log('\n🌐 API Endpoints:');
  console.log('   POST http://localhost:3000/v1/completions');
  console.log('   GET  http://localhost:3000/v1/budget');
  console.log('   GET  http://localhost:3000/v1/models');
  console.log('   GET  http://localhost:3000/v1/accounts');
  console.log('   GET  http://localhost:3000/v1/health');
}
