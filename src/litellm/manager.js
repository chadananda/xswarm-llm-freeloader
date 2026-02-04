import { spawn } from 'child_process';
import { LiteLLMClient } from './client.js';
import { LiteLLMConfigGenerator } from './configGenerator.js';
import path from 'path';

/**
 * LiteLLM subprocess manager
 */
export class LiteLLMManager {
  constructor(db, config, logger) {
    this.db = db;
    this.config = config;
    this.logger = logger;

    this.port = config.server?.litellmPort || 4000;
    this.baseUrl = `http://localhost:${this.port}`;
    this.client = new LiteLLMClient(this.baseUrl, logger);

    this.process = null;
    this.healthCheckInterval = null;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 3;

    // Get config path
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    this.configPath = path.join(homeDir, '.xswarm', 'litellm-config.yaml');
  }

  /**
   * Start LiteLLM subprocess
   * @returns {Promise<void>}
   */
  async start() {
    if (this.process && !this.process.killed) {
      this.logger.warn('LiteLLM already running');
      return;
    }

    // Generate config
    const generator = new LiteLLMConfigGenerator(this.db, this.logger);
    await generator.generate(this.configPath);

    // Spawn LiteLLM process
    this.logger.info(`Starting LiteLLM on port ${this.port}...`);

    this.process = spawn('litellm', [
      '--config', this.configPath,
      '--port', this.port.toString(),
      '--num_workers', '4'
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1'
      }
    });

    // Handle output
    this.process.stdout.on('data', (data) => {
      this.logger.debug(`LiteLLM: ${data.toString().trim()}`);
    });

    this.process.stderr.on('data', (data) => {
      this.logger.error(`LiteLLM error: ${data.toString().trim()}`);
    });

    // Handle exit
    this.process.on('exit', (code) => {
      if (code !== 0 && !this.stopping) {
        this.logger.error(`LiteLLM exited with code ${code}`);
        this.handleCrash();
      }
    });

    // Wait for ready
    await this.waitForReady(30000);

    // Start health monitoring
    this.startHealthChecks();

    this.logger.info('LiteLLM started successfully');
  }

  /**
   * Stop LiteLLM subprocess
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.process || this.process.killed) {
      return;
    }

    this.stopping = true;
    this.stopHealthChecks();

    this.logger.info('Stopping LiteLLM...');

    // Send SIGTERM
    this.process.kill('SIGTERM');

    // Wait for graceful shutdown
    await this.waitForExit(5000);

    // Force kill if still running
    if (!this.process.killed) {
      this.logger.warn('Force killing LiteLLM process');
      this.process.kill('SIGKILL');
    }

    this.process = null;
    this.stopping = false;

    this.logger.info('LiteLLM stopped');
  }

  /**
   * Restart LiteLLM subprocess
   * @returns {Promise<void>}
   */
  async restart() {
    this.logger.info('Restarting LiteLLM...');
    await this.stop();
    await this.start();
  }

  /**
   * Wait for LiteLLM to be ready
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForReady(timeout) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const health = await this.client.health();

      if (health.ok) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`LiteLLM failed to start within ${timeout}ms`);
  }

  /**
   * Wait for process to exit
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForExit(timeout) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.process.killed) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      const health = await this.client.health();

      if (!health.ok) {
        this.logger.warn('LiteLLM health check failed');
        this.handleCrash();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Handle LiteLLM crash
   */
  async handleCrash() {
    if (this.stopping) {
      return;
    }

    this.stopHealthChecks();
    this.restartAttempts++;

    if (this.restartAttempts <= this.maxRestartAttempts) {
      this.logger.warn(`Attempting restart ${this.restartAttempts}/${this.maxRestartAttempts}...`);

      try {
        await this.restart();
        this.restartAttempts = 0; // Reset on successful restart
      } catch (error) {
        this.logger.error(`Restart failed: ${error.message}`);
      }
    } else {
      this.logger.error('Max restart attempts reached, giving up');
    }
  }

  /**
   * Get LiteLLM client
   * @returns {LiteLLMClient}
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if LiteLLM is running
   * @returns {boolean}
   */
  isRunning() {
    return this.process && !this.process.killed;
  }
}
