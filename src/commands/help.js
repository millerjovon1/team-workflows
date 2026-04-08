import { log } from '../utils/log.js';

const COMMANDS = [
  { name: 'init',       desc: 'Set up team-workflows in the current repo' },
  { name: 'help',       desc: 'Show this help message' },
  { name: 'start',      desc: 'Create a safe feature branch from the default branch' },
  { name: 'check',      desc: 'Verify repo state, build readiness, and branch hygiene' },
  { name: 'staging',    desc: 'Prepare and push a staging-safe flow' },
  { name: 'production', desc: 'Enforce a production-safe merge flow (no force push)' },
  { name: 'netlify',    desc: 'Inspect repo and print recommended Netlify configuration' },
];

export function help() {
  log.header('team-workflows — CLI Commands');
  log.blank();
  log.info('Recommended order:');
  log.dim('init → start → (code) → check → staging → production');
  log.blank();

  const pad = Math.max(...COMMANDS.map(c => c.name.length)) + 2;
  for (const cmd of COMMANDS) {
    const label = cmd.name.padEnd(pad);
    console.log(`  \x1b[36m${label}\x1b[0m ${cmd.desc}`);
  }

  log.blank();
  log.info('Run via npm scripts after init:');
  log.dim('npm run wf:help | wf:start | wf:check | wf:staging | wf:production | wf:netlify');
  log.blank();
}
