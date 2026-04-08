import { help } from './commands/help.js';
import { init } from './commands/init.js';
import { start } from './commands/start.js';
import { check } from './commands/check.js';
import { staging } from './commands/staging.js';
import { production } from './commands/production.js';
import { netlify } from './commands/netlify.js';
import { log } from './utils/log.js';

const commands = { init, help, start, check, staging, production, netlify };

export async function run(args) {
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    help();
    process.exit(0);
  }

  if (!commands[command]) {
    log.error(`Unknown command: ${command}`);
    log.info('Run "team-workflows help" to see available commands.');
    process.exit(1);
  }

  try {
    await commands[command](args.slice(1));
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
