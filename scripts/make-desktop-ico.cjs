const fs = require('fs');
const path = require('path');

/**
 * Build a multi-size PNG-compressed .ico (Vista+) for Windows taskbar / exe.
 * Single huge PNG-in-ICO often fails; Electron then falls back to default icon.
 */
async function main() {
  const root = path.resolve(__dirname, '..');
  const src = path.join(root, 'desktop/resources/icon.png');
  const dest = path.join(root, 'desktop/resources/icon.ico');
  if (!fs.existsSync(src)) {
    throw new Error(`Missing ${src}`);
  }

  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.warn('sharp yok — tek PNG ICO yazılıyor (taskbar için ideal değil)');
    const png = fs.readFileSync(src);
    fs.writeFileSync(dest, buildIco([{ width: 0, height: 0, png }]));
    console.log(`Wrote ${dest} (${fs.statSync(dest).size} bytes)`);
    return;
  }

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const entries = [];
  for (const size of sizes) {
    const png = await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    entries.push({
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      png,
    });
  }

  fs.writeFileSync(dest, buildIco(entries));
  console.log(`Wrote ${dest} (${fs.statSync(dest).size} bytes, ${sizes.join('/')}px)`);
}

function buildIco(entries) {
  const count = entries.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  for (let i = 0; i < count; i++) {
    const e = entries[i];
    const o = 6 + i * 16;
    header.writeUInt8(e.width & 0xff, o);
    header.writeUInt8(e.height & 0xff, o + 1);
    header.writeUInt8(0, o + 2);
    header.writeUInt8(0, o + 3);
    header.writeUInt16LE(1, o + 4);
    header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(e.png.length, o + 8);
    header.writeUInt32LE(offset, o + 12);
    offset += e.png.length;
  }

  return Buffer.concat([header, ...entries.map((e) => e.png)]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
