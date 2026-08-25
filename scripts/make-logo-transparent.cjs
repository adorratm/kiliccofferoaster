const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'api/assets/email/logo-email.png');
const outs = [
  path.join(root, 'api/assets/email/logo-email.png'),
  path.join(root, 'frontend/public/images/brand/logo-email.png'),
];

(async () => {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 245 && g > 245 && b > 245) {
      data[i + 3] = 0;
    } else if (r > 230 && g > 230 && b > 230) {
      const whiteness = Math.min(r, g, b);
      data[i + 3] = Math.max(0, Math.round((255 - whiteness) * (255 / 25)));
    }
  }

  const png = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  for (const out of outs) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, png);
    console.log('wrote', out, png.length);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
