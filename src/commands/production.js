import * as readline from 'node:readline';
import { isGitRepo, currentBranch, hasUncommittedChanges, defaultBranch, hasRemote, exec } from '../utils/git.js';
import { log } from '../utils/log.js';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

import { runHook } from '../utils/hooks.js';
import { logAction } from '../utils/report.js';

export async function production() {
  runHook('pre-merge');
  logAction('production', { branch: currentBranch() });
  log.header('team-workflows production');

  if (!isGitRepo()) {
    log.error('Not a git repository.');
    process.exit(1);
  }

  const branch = currentBranch();
  const base = defaultBranch();

  if (!hasRemote()) {
    log.error('No remote configured.');
    process.exit(1);
  }

  if (hasUncommittedChanges()) {
    log.error('Uncommitted changes detected. Commit everything first.');
    process.exit(1);
  }

  if (branch === base) {
    log.error(`You are on "${base}". This command merges a feature branch into "${base}".`);
    log.info('Switch to your feature branch first.');
    process.exit(1);
  }

  log.step('Pre-flight checks...');

  try {
    exec(`git ls-remote --exit-code --heads origin ${branch}`);
    log.success(`Branch "${branch}" exists on remote.`);
  } catch {
    log.error(`Branch "${branch}" has not been pushed. Run "npm run wf:staging" first.`);
    process.exit(1);
  }

  log.blank();
  log.info(`This will merge "${branch}" into "${base}" (no force push).`);
  log.info('Commits to be merged:');
  try {
    const commits = exec(`git log ${base}..${branch} --oneline`);
    if (!commits) {
      log.warn('No new commits to merge. Branch is already up to date.');
      process.exit(0);
    }
    console.log(commits.split('\n').map(l => `  ${l}`).join('\n'));
  } catch {
    log.info('Could not determine commit diff.');
  }

  log.blank();
  const answer = await ask(`Merge "${branch}" into "${base}" and push? (y/N) `);
  if (answer.toLowerCase() !== 'y') {
    log.info('Aborted. No changes made.');
    process.exit(0);
  }

  try {
    exec(`git checkout ${base}`);
    try {
      exec(`git pull --ff-only origin ${base}`);
    } catch {
      log.warn(`Could not fast-forward "${base}". Attempting merge anyway...`);
      exec(`git pull origin ${base}`);
    }

    exec(`git merge ${branch} --no-edit`);
    log.success(`Merged "${branch}" into "${base}".`);

    exec(`git push origin ${base}`);
    log.success(`Pushed "${base}" to origin.`);
  } catch (err) {
    log.error(`Production merge failed: ${err.message}`);
    log.info('Resolve conflicts manually, then push.');
    try { exec(`git checkout ${branch}`); } catch { /* stay */ }
    process.exit(1);
  }

  log.blank();
  log.success('Production merge complete!');
  log.info(`You are now on "${base}". Your feature branch "${branch}" can be deleted when ready.`);
  log.dim(`  git branch -d ${branch}`);
  log.dim(`  git push origin --delete ${branch}`);
  log.blank();
}
