import { help } from './commands/help.js';
import { init } from './commands/init.js';
import { start } from './commands/start.js';
import { check } from './commands/check.js';
import { staging } from './commands/staging.js';
import { production } from './commands/production.js';
import { netlify } from './commands/netlify.js';
import { preview } from './commands/preview.js';
import { update } from './commands/update.js';
import { status } from './commands/status.js';
import { fix } from './commands/fix.js';
import { doctor } from './commands/doctor.js';
import { log } from './utils/log.js';

const commands = {
  init, help, start, check, staging, production,
  netlify, preview, update, status, fix, doctor,
};

export async function run(args) {
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    help();
    process.exit(0);
  }

  if (!commands[command]) {
    log.error(`Unknown command: ${command}`);
    log.info('Run "npm run wf:help" to see available commands.');
    process.exit(1);
  }

  try {
    await commands[command](args.slice(1));
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
