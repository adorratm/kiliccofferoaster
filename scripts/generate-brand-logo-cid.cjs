const fs = require('fs');
const path = require('path');

const png = path.join(__dirname, '../api/assets/email/logo-email.png');
const out = path.join(
  __dirname,
  '../api/src/modules/notifications/brand-logo.ts',
);
const b64 = fs.readFileSync(png).toString('base64');
const src = `/** Auto-generated brand logo for CID email attachments — do not edit by hand. */
export const BRAND_LOGO_CID = 'kilic-brand-logo';
export const BRAND_LOGO_FILENAME = 'logo-email.png';
export const BRAND_LOGO_CONTENT_TYPE = 'image/png';
export const BRAND_LOGO_BASE64 = '${b64}';
`;
fs.writeFileSync(out, src);
console.log('wrote', out, 'pngBytes=', Buffer.from(b64, 'base64').length);
