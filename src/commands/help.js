import { log } from '../utils/log.js';

const CORE_WORKFLOW = [
  { step: '1', name: 'wf:init',       desc: 'Set up this project for team workflows' },
  { step: '2', name: 'wf:start',      desc: 'Create a safe feature branch' },
  { step: '3', name: 'wf:check',      desc: 'Validate build, branch hygiene, and policies' },
  { step: '4', name: 'wf:staging',    desc: 'Push feature branch to staging environment' },
  { step: '5', name: 'wf:production', desc: 'Merge feature branch to production (main)' },
];

const UTILITIES = [
  { name: 'wf:status',  desc: 'Show branch, build, and deployment readiness' },
  { name: 'wf:fix',     desc: 'Detect common issues and print likely fixes' },
  { name: 'wf:doctor',  desc: 'Full repo health audit' },
  { name: 'wf:preview', desc: 'Build and serve production output locally' },
  { name: 'wf:netlify', desc: 'Detect framework and recommend Netlify config' },
  { name: 'wf:update',  desc: 'Pull latest workflow templates' },
];

export function help() {
  log.header('team-workflows');
  log.blank();
  console.log(`  \x1b[1mCORE WORKFLOW\x1b[0m  \x1b[2m(run in order)\x1b[0m`);
  log.blank();
  for (const cmd of CORE_WORKFLOW) {
    const label = `npm run ${cmd.name}`.padEnd(30);
    console.log(`  \x1b[1m${cmd.step}.\x1b[0m \x1b[36m${label}\x1b[0m ${cmd.desc}`);
  }
  log.blank();
  console.log(`  \x1b[1mUTILITIES\x1b[0m  \x1b[2m(run anytime)\x1b[0m`);
  log.blank();
  for (const cmd of UTILITIES) {
    const label = `npm run ${cmd.name}`.padEnd(32);
    console.log(`     \x1b[36m${label}\x1b[0m ${cmd.desc}`);
  }
  log.blank();
  log.dim('Tip: run "npm run wf:status" at any time to see where you are in the workflow.');
  log.blank();
}
