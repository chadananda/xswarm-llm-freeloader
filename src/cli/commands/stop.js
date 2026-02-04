import { DaemonController } from '../../daemon/controller.js';

/**
 * Stop daemon
 */
export async function stopCommand() {
  const controller = new DaemonController(console);

  try {
    await controller.stop();
    console.log('✅ Daemon stopped successfully');
  } catch (error) {
    console.error(`❌ Failed to stop daemon: ${error.message}`);
    process.exit(1);
  }
}
