import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { log } from '../utils/log.js';
import { currentBranch, hasUncommittedChanges, hasRemote, defaultBranch } from '../utils/git.js';
import { fileExists, readJson } from '../utils/fs.js';

function pass(label, detail = '') {
  console.log(`  \x1b[32m✔\x1b[0m  ${label.padEnd(30)} \x1b[2m${detail}\x1b[0m`);
}
function fail(label, detail = '') {
  console.log(`  \x1b[31m✖\x1b[0m  ${label.padEnd(30)} \x1b[33m${detail}\x1b[0m`);
}
function info(label, detail = '') {
  console.log(`  \x1b[36mℹ\x1b[0m  ${label.padEnd(30)} \x1b[2m${detail}\x1b[0m`);
}

export async function status() {
  log.header('wf:status');
  log.blank();

  const branch = currentBranch();
  const base = defaultBranch();
  const dirty = hasUncommittedChanges();
  const remote = hasRemote();

  info('Current branch', branch || 'unknown');

  if (!dirty) {
    pass('Working tree', 'clean');
  } else {
    fail('Working tree', 'uncommitted changes present');
  }

  log.blank();
  log.step('Checking build...');
  let buildOk = false;
  if (!fileExists('package.json')) {
    fail('Build', 'package.json not found — run wf:init');
  } else {
    const pkg = readJson('package.json');
    if (!pkg.scripts?.build) {
      fail('Build', 'no build script in package.json');
    } else {
      try {
        execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
        buildOk = true;
        pass('Build', 'passed');
      } catch {
        fail('Build', 'failed — run wf:fix for details');
      }
    }
  }

  log.blank();
  if (!fileExists('netlify.toml')) {
    fail('netlify.toml', 'missing — run wf:netlify to generate');
  } else {
    const toml = readFileSync(resolve(process.cwd(), 'netlify.toml'), 'utf-8');
    if (toml.includes('[build]') && (toml.includes('command') || toml.includes('publish'))) {
      pass('netlify.toml', 'present and configured');
    } else {
      fail('netlify.toml', 'present but missing [build] section');
    }
  }

  log.blank();
  const onFeature = branch && branch !== base;
  if (!onFeature) {
    fail('Staging readiness', `on default branch "${base}" — checkout a feature branch first`);
  } else if (dirty) {
    fail('Staging readiness', 'commit or stash changes first');
  } else if (!remote) {
    fail('Staging readiness', 'no remote configured — add origin');
  } else {
    pass('Staging readiness', 'ready to run wf:staging');
  }

  const logPath = resolve(process.cwd(), '.wf-log.json');
  let hasStaging = false;
  if (existsSync(logPath)) {
    try {
      const entries = JSON.parse(readFileSync(logPath, 'utf-8'));
      hasStaging = entries.some(e => e.action === 'staging' && e.details?.branch === branch);
    } catch { /* malformed log */ }
  }

  if (!onFeature) {
    fail('Production readiness', 'not on a feature branch');
  } else if (!hasStaging) {
    fail('Production readiness', `branch "${branch}" not yet pushed to staging`);
  } else if (dirty) {
    fail('Production readiness', 'uncommitted changes present');
  } else if (!buildOk) {
    fail('Production readiness', 'build must pass first');
  } else {
    pass('Production readiness', 'ready to run wf:production');
  }

  log.blank();
}
