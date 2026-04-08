import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

console.log('[wf:pre-push] Running safety checks before push...');

let hasCheckScript = false;
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  hasCheckScript = !!pkg.scripts?.['wf:check'];
} catch { /* no package.json */ }

if (!hasCheckScript) {
  console.log('[wf:pre-push] wf:check not configured — skipping.');
  process.exit(0);
}

try {
  execSync('npm run wf:check', { stdio: 'inherit' });
  console.log('[wf:pre-push] All checks passed. Push allowed.');
} catch {
  console.error('[wf:pre-push] Checks failed — push blocked. Fix issues above and retry.');
  process.exit(1);
}
