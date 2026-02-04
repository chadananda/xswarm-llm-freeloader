#!/usr/bin/env node

/**
 * Post-install script to install LiteLLM
 *
 * This script checks for Python 3.8+ and installs LiteLLM via pip.
 * If installation fails, it provides clear instructions for manual installation.
 */

import { execSync } from 'child_process';
import { getPythonCommand, getPipCommand, checkPythonVersion } from '../src/utils/platform.js';

const REQUIRED_PYTHON_VERSION = { major: 3, minor: 8 };

console.log('\n🔍 Checking Python installation...');

try {
  // Check Python version
  const version = checkPythonVersion();
  console.log(`✓ Found Python ${version.major}.${version.minor}.${version.patch}`);

  if (version.major !== 3 || version.minor < REQUIRED_PYTHON_VERSION.minor) {
    throw new Error(
      `Python ${REQUIRED_PYTHON_VERSION.major}.${REQUIRED_PYTHON_VERSION.minor}+ required, ` +
      `but found ${version.major}.${version.minor}.${version.patch}`
    );
  }

  // Get pip command
  const pipCmd = getPipCommand();
  console.log(`✓ Found pip (${pipCmd})`);

  // Check if LiteLLM is already installed
  try {
    execSync('litellm --version', { stdio: 'pipe' });
    console.log('✓ LiteLLM already installed');
    process.exit(0);
  } catch (e) {
    // Not installed, continue with installation
  }

  // Install LiteLLM
  console.log('\n📦 Installing LiteLLM...');
  console.log('   This may take a few minutes...\n');

  try {
    execSync(`${pipCmd} install litellm --break-system-packages`, {
      stdio: 'inherit'
    });
  } catch (e) {
    // Try without --break-system-packages flag (for non-system Python)
    console.log('\n⚠️  Retrying without --break-system-packages flag...\n');
    execSync(`${pipCmd} install litellm`, {
      stdio: 'inherit'
    });
  }

  // Verify installation
  console.log('\n🔍 Verifying LiteLLM installation...');
  const litellmVersion = execSync('litellm --version', { encoding: 'utf8' }).trim();
  console.log(`✓ LiteLLM installed successfully: ${litellmVersion}`);

  console.log('\n✅ Installation complete!\n');

} catch (error) {
  console.error('\n❌ LiteLLM installation failed\n');
  console.error(`Error: ${error.message}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📚 Manual Installation Instructions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!error.message.includes('Python')) {
    console.log('🐍 Install Python 3.8+ from:');
    console.log('   • macOS: https://www.python.org/downloads/');
    console.log('   • Linux: sudo apt install python3 python3-pip');
    console.log('   • Windows: https://www.python.org/downloads/\n');
  }

  console.log('📦 Then install LiteLLM manually:');
  console.log('   pip3 install litellm\n');

  console.log('🔍 Verify installation:');
  console.log('   litellm --version\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⚠️  xSwarm-Freeloader requires LiteLLM to function.');
  console.log('   Please complete manual installation before running xswarm.\n');

  // Don't fail npm install - allow user to continue and install manually
  process.exit(0);
}
