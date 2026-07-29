#!/usr/bin/env node
/**
 * Stok görsellerini Unsplash’tan indirip S3’e yükler (yalnızca kaynak; sitede Unsplash yok).
 *
 * Kullanım (kök, AWS env dolu):
 *   yarn stock:upload
 *
 * Sonra deploy — migration Unsplash URL’lerini stock/* ile değiştirir.
 */

import { createWriteStream, mkdirSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { fileURLToPath } from "url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

loadEnv({ path: join(root, ".env") });
loadEnv({ path: join(root, "api", ".env") });
loadEnv({ path: join(root, "deploy", ".env.production") });

const STOCK = {
  hero: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=2000&q=80",
  ethos:
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80",
  workshop:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
  blog: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=80",
  og: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
  "product-1":
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
  "product-2":
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  "product-3":
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80",
  "product-4":
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=80",
  "product-5":
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
};

/** Birincil URL 404 olursa yedekler */
const FALLBACKS = [
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
];

const outDir = join(root, "scripts", ".stock-cache");
mkdirSync(outDir, { recursive: true });

const region = process.env.AWS_REGION || "eu-central-1";
const bucket = process.env.AWS_S3_BUCKET || "";
const accessKey = process.env.AWS_ACCESS_KEY_ID || "";
const secretKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const cdnUrl = (process.env.AWS_CDN_URL || process.env.NEXT_PUBLIC_CDN_URL || "").replace(
  /\/$/,
  "",
);

const s3 =
  bucket && accessKey && secretKey
    ? new S3Client({
        region,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      })
    : null;

async function download(url, dest, extras = []) {
  if (existsSync(dest)) return dest;
  const candidates = [url, ...extras];
  let lastErr = null;
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        headers: { "User-Agent": "kiliccofferoaster-stock-upload/1.0" },
      });
      if (!res.ok) {
        lastErr = new Error(`Download failed ${res.status}: ${candidate}`);
        continue;
      }
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      return dest;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`Download failed: ${url}`);
}

async function upload(key, filePath) {
  const body = readFileSync(filePath);
  if (!s3) {
    const local = join(root, "api", "uploads", key.replace(/\//g, "_"));
    mkdirSync(dirname(local), { recursive: true });
    const { writeFileSync } = await import("fs");
    writeFileSync(local, body);
    const apiUrl = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");
    return { key, url: `${apiUrl}/uploads/${key.replace(/\//g, "_")}`, provider: "local" };
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const url = cdnUrl
    ? `${cdnUrl}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { key, url, provider: "s3" };
}

const results = {};
console.log(s3 ? `S3 → ${bucket}` : "S3 yok — api/uploads/ yerel kayıt");

for (const [name, url] of Object.entries(STOCK)) {
  const file = join(outDir, `${name}.jpg`);
  process.stdout.write(`↓ ${name}… `);
  await download(url, file, FALLBACKS);
  const key = `stock/${name}.jpg`;
  const uploaded = await upload(key, file);
  results[name] = uploaded.url;
  console.log(`${uploaded.provider} → ${uploaded.url}`);
}

console.log("\n--- Admin Site Ayarları / İçerik için URL'ler ---\n");
console.log(`OG görseli:     ${results.og}`);
console.log(`Hero:           ${results.hero}`);
console.log(`Ethos:          ${results.ethos}`);
console.log(`Workshop:       ${results.workshop}`);
console.log(`Blog hero:      ${results.blog}`);
console.log("\nFrontend NEXT_PUBLIC_CDN_URL set ise fallback'ler otomatik /stock/*.jpg kullanır.");
console.log(JSON.stringify(results, null, 2));
