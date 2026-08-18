const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createRequire } = require('module');

const electronDir = path.join(__dirname, '..', 'node_modules', 'electron');
const electronRequire = createRequire(path.join(electronDir, 'install.js'));
const { downloadArtifact } = electronRequire('@electron/get');
const { version } = require(path.join(electronDir, 'package.json'));
const distDir = path.join(electronDir, 'dist');
const exeName =
  process.platform === 'win32'
    ? 'electron.exe'
    : process.platform === 'darwin'
      ? path.join('Electron.app', 'Contents', 'MacOS', 'Electron')
      : 'electron';
const exePath = path.join(distDir, exeName);

function unzip(zipPath, dest) {
  fs.mkdirSync(dest, { recursive: true });
  if (process.platform === 'win32') {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: 'inherit' },
    );
    return;
  }
  execFileSync('unzip', ['-o', zipPath, '-d', dest], { stdio: 'inherit' });
}

async function main() {
  if (fs.existsSync(exePath) && fs.existsSync(path.join(electronDir, 'path.txt'))) {
    console.log('Electron binary already present');
    return;
  }

  console.log('Downloading Electron', version, process.platform, process.arch);
  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    checksums: require(path.join(electronDir, 'checksums.json')),
    platform: process.platform,
    arch: process.arch,
  });
  if (!zipPath || !fs.existsSync(zipPath)) {
    throw new Error('Electron zip not found after download');
  }

  console.log('Extracting…');
  unzip(zipPath, distDir);
  fs.writeFileSync(path.join(electronDir, 'path.txt'), exeName.replace(/\\/g, '/'));
  if (!fs.existsSync(exePath)) {
    throw new Error('Electron binary missing after extract');
  }
  console.log('Electron installed');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
