const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

/** EAS / CI: Electron gerekmez; script yoksa da install düşmesin. */
if (process.env.EAS_BUILD || process.env.CI) {
  console.log('Skipping Electron download (EAS/CI)');
  process.exit(0);
}

const script = join(__dirname, '../../scripts/download-electron.cjs');
if (!existsSync(script)) {
  console.log('Skipping Electron download (script not present)');
  process.exit(0);
}

const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
process.exit(result.status === null ? 1 : result.status);
