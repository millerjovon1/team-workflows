import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { isGitRepo } from '../utils/git.js';
import { fileExists, readJson, writeJson, safeWrite } from '../utils/fs.js';
import { log } from '../utils/log.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, '..', 'templates');

function loadTemplate(name) {
  return readFileSync(join(TEMPLATES_DIR, name), 'utf-8');
}

export async function init() {
  log.header('team-workflows init');

  // 1. Verify git repo
  if (!isGitRepo()) {
    log.error('This is not a git repository. Run "git init" first.');
    process.exit(1);
  }
  log.success('Git repository detected.');

  // 2. Detect or create package.json
  const pkgPath = 'package.json';
  let pkg;
  if (fileExists(pkgPath)) {
    pkg = readJson(pkgPath);
    log.success('Found existing package.json.');
  } else {
    pkg = {
      name: resolve('.').split('/').pop(),
      version: '1.0.0',
      private: true,
      scripts: {},
    };
    writeJson(pkgPath, pkg);
    log.success('Created package.json.');
  }

  // 3. Add npm scripts
  if (!pkg.scripts) pkg.scripts = {};
  const scripts = {
    'wf:help':       'npx team-workflows help',
    'wf:start':      'npx team-workflows start',
    'wf:check':      'npx team-workflows check',
    'wf:staging':    'npx team-workflows staging',
    'wf:production': 'npx team-workflows production',
    'wf:netlify':    'npx team-workflows netlify',
  };

  let scriptsAdded = 0;
  for (const [key, val] of Object.entries(scripts)) {
    if (!pkg.scripts[key]) {
      pkg.scripts[key] = val;
      scriptsAdded++;
    }
  }
  writeJson(pkgPath, pkg);
  if (scriptsAdded > 0) {
    log.success(`Added ${scriptsAdded} npm scripts (wf:*).`);
  } else {
    log.info('All wf:* npm scripts already present.');
  }

  // 4. netlify.toml
  if (safeWrite('netlify.toml', loadTemplate('netlify.toml'))) {
    log.success('Created netlify.toml.');
  } else {
    log.info('netlify.toml already exists — skipped.');
  }

  // 5. .vscode/tasks.json
  if (safeWrite('.vscode/tasks.json', loadTemplate('tasks.json'))) {
    log.success('Created .vscode/tasks.json.');
  } else {
    log.info('.vscode/tasks.json already exists — skipped.');
  }

  // 6. GitHub Actions workflows
  const workflows = ['staging.yml', 'production.yml'];
  for (const wf of workflows) {
    const dest = `.github/workflows/${wf}`;
    if (safeWrite(dest, loadTemplate(wf))) {
      log.success(`Created ${dest}.`);
    } else {
      log.info(`${dest} already exists — skipped.`);
    }
  }

  // 7. START-HERE.md
  if (safeWrite('START-HERE.md', loadTemplate('START-HERE.md'))) {
    log.success('Created START-HERE.md.');
  } else {
    log.info('START-HERE.md already exists — skipped.');
  }

  log.blank();
  log.success('Initialization complete!');
  log.info('Next steps:');
  log.dim('1. Read START-HERE.md');
  log.dim('2. npm run wf:start   — create a feature branch');
  log.dim('3. npm run wf:check   — verify before pushing');
  log.dim('4. npm run wf:staging — push to staging');
  log.blank();
}
