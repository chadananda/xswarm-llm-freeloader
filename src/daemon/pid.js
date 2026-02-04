import fs from 'fs';
import path from 'path';

/**
 * PID file management
 */
export class PidFile {
  constructor(pidPath = null) {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    this.pidPath = pidPath || path.join(homeDir, '.xswarm', 'daemon.pid');
  }

  /**
   * Write PID to file
   * @param {number} pid - Process ID
   */
  write(pid) {
    const dir = path.dirname(this.pidPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.pidPath, pid.toString(), 'utf8');
  }

  /**
   * Read PID from file
   * @returns {number|null} Process ID or null if not found
   */
  read() {
    if (!fs.existsSync(this.pidPath)) {
      return null;
    }

    try {
      const pidString = fs.readFileSync(this.pidPath, 'utf8').trim();
      return parseInt(pidString, 10);
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove PID file
   */
  remove() {
    if (fs.existsSync(this.pidPath)) {
      fs.unlinkSync(this.pidPath);
    }
  }

  /**
   * Check if process is running
   * @param {number} pid - Process ID
   * @returns {boolean} True if process is running
   */
  isProcessRunning(pid) {
    if (!pid) return false;

    try {
      // Send signal 0 to check if process exists
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if daemon is running
   * @returns {boolean} True if daemon is running
   */
  isRunning() {
    const pid = this.read();
    return this.isProcessRunning(pid);
  }
}
