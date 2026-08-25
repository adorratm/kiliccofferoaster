/**
 * CID logo + yeni şablon smoke testi.
 * Kullanım: node scripts/send-order-mail-test.cjs
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

const root = path.resolve(__dirname, '..');
loadEnv(path.join(root, '.env'));

const C = {
  page: '#14110f',
  card: '#1c1714',
  header: '#f4efe8',
  cream: '#f5efe6',
  muted: '#a89888',
  soft: '#e8ddd0',
  line: '#3d3229',
  accent: '#8c6566',
  accentSoft: '#c4a574',
  footer: '#120f0d',
};

const CID = 'kilic-brand-logo';
const logoPath = path.join(root, 'api/assets/email/logo-email.png');
const host = process.env.MAIL_HOST || '';
const user = process.env.MAIL_USER || '';
const pass = (process.env.MAIL_PASS || '').replace(/^"|"$/g, '');
const port = parseInt(process.env.MAIL_PORT || '465', 10);
const secure = process.env.MAIL_SECURE === 'true' || port === 465;
const from =
  process.env.MAIL_FROM ||
  'Kılıç Coffee Roaster <info@kiliccoffeeroaster.com.tr>';

const alertEmails = (process.env.ORDER_ALERT_EMAILS || user)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

if (!host || !user || !pass) {
  console.error('MAIL_HOST / MAIL_USER / MAIL_PASS eksik');
  process.exit(1);
}
if (!fs.existsSync(logoPath)) {
  console.error('Logo yok:', logoPath);
  process.exit(1);
}

const orderNo = `TEST-${Date.now().toString().slice(-8)}`;

async function main() {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  await transporter.verify();

  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${C.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border:1px solid ${C.line};">
  <tr><td style="padding:28px 28px 22px;background:${C.header};border-bottom:3px solid ${C.accent};text-align:center;">
    <img src="cid:${CID}" width="220" alt="Kılıç Coffee Roaster" style="display:block;margin:0 auto;width:220px;max-width:72%;height:auto;border:0;" />
    <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${C.accent};">Torbalı · İzmir</p>
  </td></tr>
  <tr><td style="height:3px;background:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:30px 28px;">
    <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${C.accentSoft};">CID logo testi</p>
    <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:${C.cream};">Logo ekli şablon</h1>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:${C.soft};"><strong style="color:${C.cream};">${orderNo}</strong> — logo Gmail’de CID (inline attachment) ile geliyor; uzak URL değil.</p>
  </td></tr>
  <tr><td style="padding:24px 28px;border-top:1px solid ${C.line};background:${C.footer};">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:${C.muted};">info@kiliccoffeeroaster.com.tr · +90 541 214 79 63</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const to = alertEmails.join(', ');
  const info = await transporter.sendMail({
    from,
    to,
    subject: `CID logo testi — ${orderNo}`,
    html,
    text: `CID logo testi ${orderNo}`,
    attachments: [
      {
        filename: 'logo-email.png',
        path: logoPath,
        cid: CID,
        contentDisposition: 'inline',
        contentType: 'image/png',
      },
    ],
  });
  console.log(`CID test maili gönderildi → ${to} id=${info.messageId}`);
}

main().catch((err) => {
  console.error('SMTP HATA:', err && err.message ? err.message : err);
  process.exit(1);
});
