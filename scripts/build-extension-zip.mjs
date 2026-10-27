// Packs chrome-extension/ for the Chrome Web Store (test fixtures left out):
//   npm run ext:zip  →  extension-build/brandos-chrome-<version>.zip
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('chrome-extension/manifest.json', 'utf8'));
const out = `extension-build/brandos-chrome-${version}.zip`;
mkdirSync('extension-build', { recursive: true });
rmSync(out, { force: true });
execFileSync('zip', ['-r', '-X', `../${out}`, '.', '-x', 'test/*', '*.DS_Store'], {
  cwd: 'chrome-extension',
  stdio: 'inherit',
});
console.log(`\n${out}`);
