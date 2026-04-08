import { fileExists, readJson, readText } from '../utils/fs.js';
import { log } from '../utils/log.js';

export async function netlify() {
  log.header('team-workflows netlify — Config Inspector');

  let framework = 'static';
  let buildCmd = '';
  let publishDir = '';
  let nodeVersion = '18';

  if (fileExists('vite.config.ts') || fileExists('vite.config.js')) {
    framework = 'vite';
  } else if (fileExists('next.config.js') || fileExists('next.config.mjs') || fileExists('next.config.ts')) {
    framework = 'next';
  } else if (fileExists('nuxt.config.ts') || fileExists('nuxt.config.js')) {
    framework = 'nuxt';
  } else if (fileExists('astro.config.mjs') || fileExists('astro.config.ts')) {
    framework = 'astro';
  }

  let pkgManager = 'npm';
  let installCmd = 'npm ci';
  if (fileExists('pnpm-lock.yaml')) {
    pkgManager = 'pnpm';
    installCmd = 'corepack enable && pnpm install --frozen-lockfile';
    nodeVersion = '20';
  } else if (fileExists('yarn.lock')) {
    pkgManager = 'yarn';
    installCmd = 'yarn install --frozen-lockfile';
  } else if (fileExists('bun.lockb')) {
    pkgManager = 'bun';
    installCmd = 'bun install --frozen-lockfile';
  }

  let pkg = null;
  if (fileExists('package.json')) {
    pkg = readJson('package.json');
  }

  switch (framework) {
    case 'vite': {
      buildCmd = `${installCmd} && ${pkgManager === 'npm' ? 'npm run' : pkgManager} build`;
      publishDir = 'dist';
      const configFile = fileExists('vite.config.ts') ? 'vite.config.ts' : 'vite.config.js';
      try {
        const content = readText(configFile);
        const match = content.match(/outDir\s*:\s*['"]([^'"]+)['"]/);
        if (match) publishDir = match[1];
      } catch { /* use default */ }
      break;
    }
    case 'next':
      buildCmd = `${installCmd} && ${pkgManager === 'npm' ? 'npm run' : pkgManager} build`;
      publishDir = '.next';
      break;
    case 'astro':
      buildCmd = `${installCmd} && ${pkgManager === 'npm' ? 'npm run' : pkgManager} build`;
      publishDir = 'dist';
      break;
    default:
      if (pkg?.scripts?.build) {
        buildCmd = `${installCmd} && ${pkgManager === 'npm' ? 'npm run' : pkgManager} build`;
        publishDir = 'dist';
      } else {
        buildCmd = '# No build needed';
        publishDir = '.';
      }
  }

  log.info(`Detected framework: ${framework}`);
  log.info(`Package manager: ${pkgManager}`);
  log.blank();

  if (fileExists('netlify.toml')) {
    log.info('Existing netlify.toml found:');
    const content = readText('netlify.toml');
    console.log(content);
    log.blank();
  }

  log.header('Recommended netlify.toml');
  const toml = generateToml({ buildCmd, publishDir, nodeVersion, framework });
  console.log(toml);

  log.header('Recommended Environment Variables');
  console.log(`  NODE_VERSION = ${nodeVersion}`);
  if (pkgManager === 'pnpm') {
    console.log('  COREPACK_ENABLE_STRICT = 0');
  }
  log.blank();

  if (framework === 'vite' || framework === 'static') {
    log.info('SPA redirect included: /* → /index.html (200).');
    log.dim('Remove the [[redirects]] section if your site is not a single-page app.');
  }
  log.blank();
}

function generateToml({ buildCmd, publishDir, nodeVersion, framework }) {
  let toml = `[build]
  command = "${buildCmd}"
  publish = "${publishDir}"

[build.environment]
  NODE_VERSION = "${nodeVersion}"
`;

  if (framework === 'vite' || framework === 'static') {
    toml += `
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
  }

  return toml;
}
