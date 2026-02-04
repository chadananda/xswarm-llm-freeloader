import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { PidFile } from './pid.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Daemon controller
 */
export class DaemonController {
  constructor(logger = console) {
    this.logger = logger;
    this.pidFile = new PidFile();
  }

  /**
   * Start daemon
   * @param {object} options - Start options
   * @returns {Promise<void>}
   */
  async start(options = {}) {
    if (this.pidFile.isRunning()) {
      throw new Error('Daemon already running');
    }

    const serverPath = path.join(__dirname, '../server/index.js');

    if (options.daemon) {
      // Start as background daemon
      const child = spawn('node', [serverPath], {
        detached: true,
        stdio: 'ignore'
      });

      child.unref();

      this.pidFile.write(child.pid);

      this.logger.log(`Daemon started with PID ${child.pid}`);
    } else {
      // Start in foreground
      const { start } = await import('../server/index.js');
      await start();
    }
  }

  /**
   * Stop daemon
   * @returns {Promise<void>}
   */
  async stop() {
    const pid = this.pidFile.read();

    if (!pid) {
      throw new Error('No PID file found');
    }

    if (!this.pidFile.isProcessRunning(pid)) {
      this.pidFile.remove();
      throw new Error('Daemon not running');
    }

    this.logger.log(`Stopping daemon (PID ${pid})...`);

    // Send SIGTERM
    process.kill(pid, 'SIGTERM');

    // Wait for process to exit
    await this.waitForExit(pid, 10000);

    // Force kill if still running
    if (this.pidFile.isProcessRunning(pid)) {
      this.logger.log('Force killing daemon...');
      process.kill(pid, 'SIGKILL');
      await this.waitForExit(pid, 5000);
    }

    this.pidFile.remove();

    this.logger.log('Daemon stopped');
  }

  /**
   * Get daemon status
   * @returns {object} Status information
   */
  getStatus() {
    const pid = this.pidFile.read();
    const running = this.pidFile.isRunning();

    return {
      running,
      pid: running ? pid : null
    };
  }

  /**
   * Wait for process to exit
   * @param {number} pid - Process ID
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForExit(pid, timeout) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!this.pidFile.isProcessRunning(pid)) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
