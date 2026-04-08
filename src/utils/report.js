import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const logFile = resolve('.wf-log.json');

export function logAction(action, details = {}) {
  let logs = [];
  if (existsSync(logFile)) {
    logs = JSON.parse(readFileSync(logFile, 'utf8'));
  }
  logs.push({ action, details, timestamp: new Date().toISOString() });
  writeFileSync(logFile, JSON.stringify(logs, null, 2));
}
