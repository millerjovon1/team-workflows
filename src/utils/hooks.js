import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { log } from './log.js';

export async function runHook(name) {
  const hookPath = resolve(process.cwd(), 'hooks', `${name}.js`);
  if (!existsSync(hookPath)) return;
  try {
    await import(hookPath);
  } catch (e) {
    log.error(`[wf:${name}] failed: ${e.message}`);
    process.exit(1);
  }
}
