import { execSync } from 'node:child_process';

export function exec(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', ...opts }).trim();
}

export function isGitRepo() {
  try {
    exec('git rev-parse --is-inside-work-tree');
    return true;
  } catch {
    return false;
  }
}

export function currentBranch() {
  return exec('git branch --show-current');
}

export function hasUncommittedChanges() {
  return exec('git status --porcelain').length > 0;
}

export function branchExists(name) {
  try {
    exec(`git rev-parse --verify ${name}`);
    return true;
  } catch {
    return false;
  }
}

export function hasRemote() {
  try {
    return exec('git remote').length > 0;
  } catch {
    return false;
  }
}

export function defaultBranch() {
  try {
    const ref = exec('git symbolic-ref refs/remotes/origin/HEAD');
    return ref.replace('refs/remotes/origin/', '');
  } catch {
    if (branchExists('main')) return 'main';
    if (branchExists('master')) return 'master';
    return 'main';
  }
}
