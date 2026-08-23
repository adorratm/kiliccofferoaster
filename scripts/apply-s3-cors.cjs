/**
 * S3 bucket CORS uygular (galeri lightbox / next-image crossOrigin için).
 * Kullanım (repo kökü): node scripts/apply-s3-cors.cjs
 * .env veya deploy/.env içinden AWS_* okur.
 */
const fs = require('fs');
const path = require('path');
const {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} = require('@aws-sdk/client-s3');

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
loadEnv(path.join(root, 'deploy', '.env'));

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_REGION || 'eu-central-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').replace(
  /^"|"$/g,
  '',
);

if (!bucket || !accessKeyId || !secretAccessKey) {
  console.error(
    'AWS_S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY gerekli',
  );
  process.exit(1);
}

const corsPath = path.join(root, 'deploy', 's3-cors.json');
const CORSRules = JSON.parse(fs.readFileSync(corsPath, 'utf8'));

async function main() {
  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules },
    }),
  );

  const current = await client.send(
    new GetBucketCorsCommand({ Bucket: bucket }),
  );
  console.log(`OK  CORS uygulandı: s3://${bucket}`);
  console.log(JSON.stringify(current.CORSRules, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
