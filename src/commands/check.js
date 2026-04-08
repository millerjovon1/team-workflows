import { isGitRepo, currentBranch, hasUncommittedChanges, defaultBranch, hasRemote, exec } from '../utils/git.js';
import { fileExists, readJson } from '../utils/fs.js';
import { log } from '../utils/log.js';

export async function check() {
  log.header('team-workflows check');

  let issues = 0;

  if (!isGitRepo()) {
    log.error('Not a git repository.');
    process.exit(1);
  }
  log.success('Git repository detected.');

  const branch = currentBranch();
  const base = defaultBranch();
  log.info(`Current branch: ${branch}`);
  if (branch === base) {
    log.warn(`You are on the default branch "${base}". Create a feature branch first.`);
    issues++;
  } else {
    log.success(`On feature branch "${branch}" (base: ${base}).`);
  }

  if (hasUncommittedChanges()) {
    log.warn('Uncommitted changes detected. Commit before pushing.');
    issues++;
  } else {
    log.success('Working tree is clean.');
  }

  if (hasRemote()) {
    log.success('Remote origin configured.');
  } else {
    log.warn('No git remote found. Push will fail until a remote is added.');
    issues++;
  }

  if (fileExists('package.json')) {
    log.success('package.json found.');
    const pkg = readJson('package.json');

    if (pkg.scripts?.build) {
      log.success('Build script found.');
      log.step('Running build...');
      try {
        exec('npm run build', { stdio: 'inherit' });
        log.success('Build passed.');
      } catch {
        log.error('Build failed. Fix build errors before proceeding.');
        issues++;
      }
    } else {
      log.info('No build script found — skipping build check.');
    }

    if (pkg.scripts?.lint) {
      log.step('Running lint...');
      try {
        exec('npm run lint', { stdio: 'inherit' });
        log.success('Lint passed.');
      } catch {
        log.warn('Lint failed. Consider fixing lint errors.');
        issues++;
      }
    }
  } else {
    log.warn('No package.json found.');
    issues++;
  }

  if (fileExists('vite.config.js') || fileExists('vite.config.ts')) {
    log.info('Vite project detected.');
  }

  if (fileExists('netlify.toml')) {
    log.success('netlify.toml found.');
  } else {
    log.info('No netlify.toml — run "npm run wf:netlify" for recommendations.');
  }

  log.blank();
  if (issues === 0) {
    log.success('All checks passed! Ready for staging.');
    log.dim('Next: npm run wf:staging');
  } else {
    log.warn(`${issues} issue(s) found. Review above before continuing.`);
  }
  log.blank();
}
