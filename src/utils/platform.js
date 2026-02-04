import { platform } from 'os';
import { execSync } from 'child_process';

/**
 * Platform detection utilities
 */

/**
 * Check if running on macOS
 * @returns {boolean}
 */
export function isMacOS() {
  return platform() === 'darwin';
}

/**
 * Check if running on Linux
 * @returns {boolean}
 */
export function isLinux() {
  return platform() === 'linux';
}

/**
 * Check if running on Windows
 * @returns {boolean}
 */
export function isWindows() {
  return platform() === 'win32';
}

/**
 * Get Python command (python3 or python)
 * @returns {string} Python command
 */
export function getPythonCommand() {
  try {
    execSync('python3 --version', { stdio: 'pipe' });
    return 'python3';
  } catch (e) {
    try {
      execSync('python --version', { stdio: 'pipe' });
      return 'python';
    } catch (e2) {
      throw new Error('Python not found. Please install Python 3.8+');
    }
  }
}

/**
 * Get pip command (pip3 or pip)
 * @returns {string} Pip command
 */
export function getPipCommand() {
  try {
    execSync('pip3 --version', { stdio: 'pipe' });
    return 'pip3';
  } catch (e) {
    try {
      execSync('pip --version', { stdio: 'pipe' });
      return 'pip';
    } catch (e2) {
      throw new Error('pip not found. Please install pip');
    }
  }
}

/**
 * Check Python version
 * @returns {object} Version info {major, minor, patch}
 */
export function checkPythonVersion() {
  try {
    const pythonCmd = getPythonCommand();
    const versionOutput = execSync(`${pythonCmd} --version`, { encoding: 'utf8' });
    const match = versionOutput.match(/Python (\d+)\.(\d+)\.(\d+)/);

    if (!match) {
      throw new Error('Could not parse Python version');
    }

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3])
    };
  } catch (error) {
    throw new Error(`Failed to check Python version: ${error.message}`);
  }
}

/**
 * Verify Python version is 3.8+
 * @returns {boolean} True if version is valid
 */
export function verifyPythonVersion() {
  const version = checkPythonVersion();
  return version.major === 3 && version.minor >= 8;
}
