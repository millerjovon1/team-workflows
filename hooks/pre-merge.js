import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('[wf:pre-merge] Validating merge conditions...');

const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
const DEFAULT_BRANCHES = ['main', 'master'];

if (DEFAULT_BRANCHES.includes(branch)) {
  console.error(`[wf:pre-merge] Cannot merge from default branch "${branch}".`);
  console.error('  → Checkout a feature branch and run "npm run wf:staging" first.');
  process.exit(1);
}

const logPath = resolve(process.cwd(), '.wf-log.json');
if (!existsSync(logPath)) {
  console.error('[wf:pre-merge] No .wf-log.json found — staging has not been run.');
  console.error('  → Run "npm run wf:staging" before merging to production.');
  process.exit(1);
}

let entries = [];
try {
  entries = JSON.parse(readFileSync(logPath, 'utf-8'));
} catch {
  console.error('[wf:pre-merge] Could not parse .wf-log.json — merge blocked.');
  process.exit(1);
}

const hasStaging = entries.some(e => e.action === 'staging' && e.details?.branch === branch);
if (!hasStaging) {
  console.error(`[wf:pre-merge] Branch "${branch}" has not been pushed to staging.`);
  console.error('  → Run "npm run wf:staging" before merging to production.');
  process.exit(1);
}

console.log(`[wf:pre-merge] Branch "${branch}" passed pre-merge validation.`);
