import * as readline from 'node:readline';
import { isGitRepo, currentBranch, hasUncommittedChanges, defaultBranch, exec } from '../utils/git.js';
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

export async function start() {
  log.header('team-workflows start');

  if (!isGitRepo()) {
    log.error('Not a git repository.');
    process.exit(1);
  }

  const branch = currentBranch();
  const base = defaultBranch();

  if (branch !== base) {
    log.warn(`You are on "${branch}", not the default branch "${base}".`);
    const answer = await ask('Continue from this branch? (y/N) ');
    if (answer.toLowerCase() !== 'y') {
      log.info(`Switch to ${base} first: git checkout ${base}`);
      process.exit(0);
    }
  }

  if (hasUncommittedChanges()) {
    log.warn('You have uncommitted changes.');
    const answer = await ask('Continue anyway? (y/N) ');
    if (answer.toLowerCase() !== 'y') {
      log.info('Commit or stash your changes first.');
      process.exit(0);
    }
  }

  try {
    log.step(`Pulling latest from origin/${branch}...`);
    exec(`git pull --ff-only origin ${branch}`);
    log.success('Up to date.');
  } catch {
    log.warn('Could not pull (no remote or no tracking branch). Continuing locally.');
  }

  const name = await ask('Feature branch name (e.g. feat/login-page): ');
  if (!name) {
    log.error('Branch name is required.');
    process.exit(1);
  }

  const safeName = name.replace(/[^a-zA-Z0-9/_-]/g, '-');
  if (safeName !== name) {
    log.info(`Sanitized branch name: ${safeName}`);
  }

  try {
    exec(`git checkout -b ${safeName}`);
    log.success(`Created and switched to branch: ${safeName}`);
  } catch (err) {
    log.error(`Failed to create branch: ${err.message}`);
    process.exit(1);
  }

  log.blank();
  log.info('Next: write your code, then run "npm run wf:check".');
  log.blank();
}
