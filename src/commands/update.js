import { exec } from '../utils/git.js';
import { log } from '../utils/log.js';

export async function update() {
  log.header('team-workflows update');
  log.info('Pulling latest workflow templates and CLI...');
  try {
    exec('git pull', { stdio: 'inherit' });
    log.success('Update complete.');
  } catch {
    log.error('Update failed.');
    process.exit(1);
  }
}
