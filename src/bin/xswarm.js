#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../cli/commands/init.js';
import { startCommand } from '../cli/commands/start.js';
import { stopCommand } from '../cli/commands/stop.js';
import { statusCommand } from '../cli/commands/status.js';
import { accountAddCommand, accountListCommand } from '../cli/commands/account.js';
import { configGetCommand, configSetCommand, configShowCommand } from '../cli/commands/config.js';

const program = new Command();

program
  .name('xswarm')
  .description('xSwarm-Freeloader - Intelligent AI router for maximizing free tier usage')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize xSwarm-Freeloader (creates ~/.xswarm/)')
  .action(async () => {
    await initCommand();
  });

// Start command
program
  .command('start')
  .description('Start the daemon')
  .option('-d, --daemon', 'Run as background daemon')
  .action(async (options) => {
    await startCommand(options);
  });

// Stop command
program
  .command('stop')
  .description('Stop the daemon')
  .action(async () => {
    await stopCommand();
  });

// Status command
program
  .command('status')
  .description('Show daemon status')
  .action(async () => {
    await statusCommand();
  });

// Account commands
const account = program
  .command('account')
  .description('Manage provider accounts');

account
  .command('add <provider> <api-key>')
  .description('Add a provider account')
  .option('--tier <tier>', 'Account tier (free|pro)', 'free')
  .option('--priority <priority>', 'Account priority (higher = preferred)', '0')
  .action(async (provider, apiKey, options) => {
    await accountAddCommand(provider, apiKey, options);
  });

account
  .command('list')
  .description('List all accounts')
  .action(async () => {
    await accountListCommand();
  });

// Config commands
const config = program
  .command('config')
  .description('Manage configuration');

config
  .command('get <key>')
  .description('Get configuration value')
  .action((key) => {
    configGetCommand(key);
  });

config
  .command('set')
  .description('Set configuration value')
  .option('--strategy <strategy>', 'Routing strategy (balanced|cost-first|speed-first|quality-first)')
  .option('--daily-budget <amount>', 'Daily budget limit (USD)')
  .option('--monthly-budget <amount>', 'Monthly budget limit (USD)')
  .action((options) => {
    configSetCommand(options);
  });

config
  .command('show')
  .description('Show full configuration')
  .action(() => {
    configShowCommand();
  });

program.parse();
