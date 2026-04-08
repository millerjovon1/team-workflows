import { exec } from '../utils/git.js';
import { log } from '../utils/log.js';

export async function preview() {
  log.header('team-workflows preview');
  log.step('Building project...');
  try {
    exec('npm run build', { stdio: 'inherit' });
    log.success('Build complete.');
  } catch {
    log.error('Build failed. Cannot preview.');
    process.exit(1);
  }
  log.step('Starting local server (npx serve dist)...');
  try {
    exec('npx serve dist', { stdio: 'inherit' });
  } catch {
    log.error('Failed to start local server. Make sure `serve` is installed.');
    process.exit(1);
  }
}
