import { DaemonController } from '../../daemon/controller.js';

/**
 * Start daemon
 */
export async function startCommand(options) {
  const controller = new DaemonController(console);

  try {
    await controller.start(options);

    if (options.daemon) {
      console.log('✅ Daemon started successfully');
      console.log('\nTo check status: xswarm status');
      console.log('To view logs: tail -f ~/.xswarm/logs/xswarm.log');
    }
  } catch (error) {
    console.error(`❌ Failed to start daemon: ${error.message}`);
    process.exit(1);
  }
}
