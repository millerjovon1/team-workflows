import * as readline from 'node:readline';
import { isGitRepo, currentBranch, hasUncommittedChanges, defaultBranch, hasRemote, branchExists, exec } from '../utils/git.js';
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

export async function staging() {
  runHook('pre-push');
  logAction('staging', { branch: currentBranch() });
  log.header('team-workflows staging');

  if (!isGitRepo()) {
    log.error('Not a git repository.');
    process.exit(1);
  }

  const branch = currentBranch();
  const base = defaultBranch();

  if (branch === base) {
    log.error(`You are on "${base}". Switch to a feature branch first.`);
    process.exit(1);
  }

  if (hasUncommittedChanges()) {
    log.error('Uncommitted changes detected. Commit everything before staging.');
    process.exit(1);
  }

  if (!hasRemote()) {
    log.error('No remote configured. Add a remote: git remote add origin <url>');
    process.exit(1);
  }

  const stagingBranch = 'staging';
  log.step(`Pushing "${branch}" to origin...`);
  try {
    exec(`git push origin ${branch}`);
    log.success(`Branch "${branch}" pushed to origin.`);
  } catch (err) {
    log.error(`Push failed: ${err.message}`);
    process.exit(1);
  }

  let stagingExists = false;
  try {
    exec(`git ls-remote --exit-code --heads origin ${stagingBranch}`);
    stagingExists = true;
  } catch {
    stagingExists = false;
  }

  if (!stagingExists) {
    log.info(`Remote branch "${stagingBranch}" does not exist.`);
    const answer = await ask(`Create "${stagingBranch}" from "${branch}"? (y/N) `);
    if (answer.toLowerCase() !== 'y') {
      log.info('Aborted.');
      process.exit(0);
    }
    exec(`git checkout -b ${stagingBranch}`);
    exec(`git push origin ${stagingBranch}`);
    exec(`git checkout ${branch}`);
    log.success(`Created and pushed "${stagingBranch}".`);
  } else {
    log.step(`Merging "${branch}" into "${stagingBranch}"...`);
    const wasOnBranch = branch;
    try {
      exec(`git fetch origin ${stagingBranch}`);
      if (branchExists(stagingBranch)) {
        exec(`git checkout ${stagingBranch}`);
        exec(`git pull --ff-only origin ${stagingBranch}`);
      } else {
        exec(`git checkout -b ${stagingBranch} origin/${stagingBranch}`);
      }

      exec(`git merge ${wasOnBranch} --no-edit`);
      exec(`git push origin ${stagingBranch}`);
      log.success(`Merged "${wasOnBranch}" into "${stagingBranch}" and pushed.`);

      exec(`git checkout ${wasOnBranch}`);
    } catch (err) {
      log.error(`Merge failed: ${err.message}`);
      log.info('Resolve conflicts manually, then push staging.');
      try { exec(`git checkout ${wasOnBranch}`); } catch { /* stay wherever we are */ }
      process.exit(1);
    }
  }

  log.blank();
  log.success('Staging flow complete.');
  log.info('Verify the staging deployment, then run "npm run wf:production".');
  log.blank();
}
