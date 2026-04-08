import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { log } from '../utils/log.js';
import { fileExists, readJson } from '../utils/fs.js';

function tryExec(cmd, opts = {}) {
  try {
    return { ok: true, out: execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', ...opts }) };
  } catch (e) {
    return { ok: false, out: e.stdout || '', err: e.stderr || e.message };
  }
}

const PATTERNS = [
  {
    match: /Cannot find module|MODULE_NOT_FOUND/i,
    issue: 'Missing module — dependencies may not be installed',
    fix: 'Run: npm install',
    autoFix: () => { execSync('npm install', { stdio: 'inherit' }); return true; },
  },
  {
    match: /command not found.*vite|sh: vite/i,
    issue: 'Vite not found in node_modules',
    fix: 'Run: npm install (or npm install --save-dev vite)',
    autoFix: () => { execSync('npm install', { stdio: 'inherit' }); return true; },
  },
  {
    match: /command not found.*rollup|sh: rollup/i,
    issue: 'Rollup not found in node_modules',
    fix: 'Run: npm install',
    autoFix: () => { execSync('npm install', { stdio: 'inherit' }); return true; },
  },
  {
    match: /ENOENT.*dist/i,
    issue: 'Output directory "dist" missing or misconfigured',
    fix: 'Check build config — ensure output dir matches netlify.toml publish path',
    autoFix: null,
  },
  {
    match: /ESLint|Lint error|eslint/i,
    issue: 'ESLint errors detected',
    fix: 'Run: npm run lint -- --fix',
    autoFix: null,
  },
  {
    match: /error TS[0-9]+|TypeScript/i,
    issue: 'TypeScript compilation errors',
    fix: 'Run: npx tsc --noEmit to see all type errors',
    autoFix: null,
  },
  {
    match: /ENOMEM|JavaScript heap out of memory/i,
    issue: 'Build ran out of memory',
    fix: 'Run: NODE_OPTIONS=--max-old-space-size=4096 npm run build',
    autoFix: null,
  },
];

export async function fix() {
  log.header('wf:fix — Issue Diagnostics');
  log.blank();

  if (!fileExists('package.json')) {
    log.error('No package.json found. Run "npm run wf:init" first.');
    process.exit(1);
  }

  const pkg = readJson('package.json');
  if (!pkg.scripts?.build) {
    log.warn('No "build" script in package.json.');
    log.dim('→ Add a build script, e.g.: "build": "vite build"');
    log.blank();
    return;
  }

  if (!existsSync('node_modules')) {
    log.warn('node_modules missing.');
    log.step('Auto-fixing: running npm install...');
    execSync('npm install', { stdio: 'inherit' });
    log.success('npm install complete.');
    log.blank();
  }

  log.step('Running build to detect issues...');
  const result = tryExec('npm run build', { timeout: 60000 });

  if (result.ok) {
    log.success('Build passed — no issues detected.');
    log.blank();
    log.dim('Run "npm run wf:doctor" for a full health audit.');
    log.blank();
    return;
  }

  const output = `${result.out}\n${result.err}`;
  log.blank();
  log.error('Build failed. Analyzing output...');
  log.blank();

  const matched = PATTERNS.filter(p => p.match.test(output));

  if (matched.length === 0) {
    log.warn('Could not automatically identify the issue.');
    log.dim('Build output:');
    console.log(result.err || result.out);
    log.blank();
    log.info('Run "npm run build" directly to see the full output.');
    log.blank();
    return;
  }

  let autoFixed = false;
  for (const issue of matched) {
    log.warn(issue.issue);
    log.dim(`  → ${issue.fix}`);
    if (issue.autoFix && !autoFixed) {
      log.step('Auto-fixing...');
      try { issue.autoFix(); autoFixed = true; }
      catch { log.warn('Auto-fix failed — apply manually.'); }
    }
    log.blank();
  }

  if (autoFixed) {
    log.step('Re-running build after auto-fix...');
    const retry = tryExec('npm run build', { timeout: 60000 });
    if (retry.ok) {
      log.success('Build passing after auto-fix.');
    } else {
      log.error('Build still failing — apply remaining fixes manually.');
    }
    log.blank();
  }
}
