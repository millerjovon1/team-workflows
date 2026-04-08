import { execSync } from 'node:child_process';
import { log } from '../utils/log.js';
import { isGitRepo, currentBranch, hasUncommittedChanges, hasRemote, defaultBranch } from '../utils/git.js';
import { fileExists, readJson } from '../utils/fs.js';
import { checkDependencyPolicy } from '../utils/deppolicy.js';

function tryExec(cmd) {
  try { return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim(); } catch { return ''; }
}

export async function doctor() {
  let passed = 0;
  let total = 0;

  function check(label, ok, hint = '') {
    total++;
    if (ok) {
      passed++;
      console.log(`  \x1b[32m✔\x1b[0m  ${label}`);
    } else {
      console.log(`  \x1b[31m✖\x1b[0m  ${label}`);
      if (hint) console.log(`       \x1b[2m→ ${hint}\x1b[0m`);
    }
  }

  log.header('wf:doctor — Repo Health Audit');
  log.blank();

  check('Git repository exists', isGitRepo(), 'run "git init" first');
  check('git user.name configured', !!tryExec('git config user.name'), 'git config user.name "Your Name"');
  check('git user.email configured', !!tryExec('git config user.email'), 'git config user.email "you@example.com"');
  check('Remote origin configured', hasRemote(), 'git remote add origin <url>');
  const remoteUrl = tryExec('git remote get-url origin');
  check('Remote URL is not localhost', !remoteUrl.includes('localhost'), 'update remote URL to a real host');

  const nodeVer = parseInt(process.version.replace('v', '').split('.')[0], 10);
  check(`Node version >= 18 (found ${process.version})`, nodeVer >= 18, 'upgrade Node.js to v18+');

  const hasPkg = fileExists('package.json');
  check('package.json exists', hasPkg, 'run npm init or wf:init');
  if (hasPkg) {
    const pkg = readJson('package.json');
    check('package.json has name', !!pkg.name, 'add "name" field');
    check('package.json has version', !!pkg.version, 'add "version" field');
    check('package.json has build script', !!pkg.scripts?.build, 'add a "build" script');
  }

  check('netlify.toml present', fileExists('netlify.toml'), 'run npm run wf:netlify');
  check('.github/workflows/staging.yml present', fileExists('.github/workflows/staging.yml'), 'run npm run wf:init');
  check('.github/workflows/production.yml present', fileExists('.github/workflows/production.yml'), 'run npm run wf:init');
  check('START-HERE.md present', fileExists('START-HERE.md'), 'run npm run wf:init');
  check('.gitignore exists', fileExists('.gitignore'), 'create a .gitignore file');
  check('node_modules not tracked in git', tryExec('git ls-files node_modules') === '', 'add to .gitignore and run git rm -r --cached node_modules');
  check('Dependency policy passes', checkDependencyPolicy(), 'remove banned dependencies');

  const branch = currentBranch();
  const base = defaultBranch();
  check('On a feature branch (not default)', branch !== base, `checkout a feature branch — currently on "${branch}"`);
  check('No uncommitted changes', !hasUncommittedChanges(), 'commit or stash changes before deploying');

  log.blank();
  const emoji = passed === total ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
  console.log(`  ${emoji}  \x1b[1m${passed}/${total} checks passed\x1b[0m`);
  log.blank();

  if (passed < total) {
    if (!fileExists('netlify.toml') || !fileExists('START-HERE.md')) {
      log.info('Missing templates — run "npm run wf:init" to restore them.');
    }
    if (!hasPkg || !readJson('package.json')?.scripts?.build) {
      log.info('Build issues detected — run "npm run wf:fix" for diagnostics.');
    }
  }
}
