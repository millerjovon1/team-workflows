import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function fileExists(filePath) {
  return existsSync(resolve(filePath));
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(resolve(filePath), 'utf-8'));
}

export function writeJson(filePath, data) {
  writeFileSync(resolve(filePath), JSON.stringify(data, null, 2) + '\n');
}

export function readText(filePath) {
  return readFileSync(resolve(filePath), 'utf-8');
}

export function writeText(filePath, content) {
  const dir = dirname(resolve(filePath));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(filePath), content);
}

export function safeWrite(filePath, content, { overwrite = false } = {}) {
  if (existsSync(resolve(filePath)) && !overwrite) {
    return false;
  }
  writeText(filePath, content);
  return true;
}
