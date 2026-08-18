const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const electronDir = path.join(__dirname, '..', 'node_modules', 'electron');
const electronRequire = createRequire(path.join(electronDir, 'install.js'));
const { downloadArtifact } = electronRequire('@electron/get');
const { extract } = electronRequire('@electron-internal/extract-zip');
const { version } = require(path.join(electronDir, 'package.json'));
const distDir = path.join(electronDir, 'dist');
const exeName =
  process.platform === 'win32'
    ? 'electron.exe'
    : process.platform === 'darwin'
      ? path.join('Electron.app', 'Contents', 'MacOS', 'Electron')
      : 'electron';
const exePath = path.join(distDir, exeName);

async function unzip(zipPath, dest) {
  fs.mkdirSync(dest, { recursive: true });
  await extract(zipPath, { dir: dest });
}

async function main() {
  if (process.env.EAS_BUILD) {
    console.log('Skipping Electron download on EAS Build');
    return;
  }
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
  await unzip(zipPath, distDir);
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
