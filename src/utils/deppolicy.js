import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function checkDependencyPolicy() {
  const pkgPath = resolve('package.json');
  const policyPath = resolve('policy.json');
  if (!existsSync(pkgPath) || !existsSync(policyPath)) return true;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  const banned = policy.bannedDependencies || [];
  const deps = Object.keys(pkg.dependencies || {});
  const found = deps.filter(dep => banned.includes(dep));
  if (found.length) {
    console.error('Banned dependencies found:', found.join(', '));
    return false;
  }
  return true;
}
