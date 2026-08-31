#!/usr/bin/env node
/**
 * RevenueCat / App Store / Play için tutar kademeli IAP ürün listesi üretir.
 * Google/Meta feed gibi katalogdaki her varyant için değil; sabit fiyat kademeleri için.
 *
 * Kullanım:
 *   node api/scripts/generate-revenuecat-iap-tiers.mjs
 *   node api/scripts/generate-revenuecat-iap-tiers.mjs --max 3000 --step 50
 *
 * Çıktı:
 *   - REVENUECAT_PRODUCT_MAP satırı (.env için)
 *   - Play Console / App Store Connect'te oluşturulacak product id listesi
 */

const args = process.argv.slice(2);
const maxIdx = args.indexOf('--max');
const stepIdx = args.indexOf('--step');
const max = maxIdx >= 0 ? Number(args[maxIdx + 1]) : 2500;
const step = stepIdx >= 0 ? Number(args[stepIdx + 1]) : 50;
const prefix = 'kilic_checkout';

if (!Number.isFinite(max) || !Number.isFinite(step) || step <= 0) {
  console.error('Geçersiz --max veya --step');
  process.exit(1);
}

const tiers = [];
for (let amount = step; amount <= max; amount += step) {
  tiers.push({ amount, productId: `${prefix}_${amount}` });
}

const mapLine = tiers.map((t) => `${t.amount}:${t.productId}`).join(',');

console.log('# REVENUECAT_PRODUCT_MAP (.env)');
console.log(mapLine);
console.log('');
console.log('# Kargo (tutar kademesi modunda gerekmez — sipariş totaline dahil)');
console.log('# REVENUECAT_SHIPPING_PRODUCT_ID=kilic_shipping_8990');
console.log('');
console.log('# App Store Connect + Google Play Console — consumable ürünler');
console.log('# Her satır: product_id | fiyat (TRY) | görünen ad');
for (const t of tiers) {
  console.log(`${t.productId} | ${t.amount.toFixed(2)} TRY | Kılıç Coffee Sipariş ${t.amount}₺`);
}
console.log('');
console.log(`# Ek: kargo satırı (yalnızca varyant-SKU modunda)`);
console.log(`kilic_shipping_8990 | 89.90 TRY | Kargo ücreti`);
console.log(`# Toplam ${tiers.length} kademe + opsiyonel 1 kargo ürünü`);
