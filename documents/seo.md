# SEO operasyon kontrol listesi

Teknik altyapı (title/meta, Product/FAQ/CoffeeShop JSON-LD, `/sitemap.xml`, Merchant feed) kodda durur. Bu sayfa **hesap ve içerik** işleridir.

## Google hesapları

1. [Search Console](https://search.google.com/search-console) — `https://kiliccoffeeroaster.com.tr` property.
2. Sitemap: `https://kiliccoffeeroaster.com.tr/sitemap.xml` gönder. 500 olursa deploy log + Cloudflare WAF’e bak.
3. Indexing → Pages: hangileri indeksli / excluded.
4. Performance → Search results: hangi sorgular tıklama getiriyor.
5. GA4: `NEXT_PUBLIC_GA4_ID` dolu mu; Consent Mode v2 onayından sonra event geliyor mu.
6. Merchant Center: `https://kiliccoffeeroaster.com.tr/feed/google-merchant.xml` — lokum/çay artık Coffee kategorisinde olmamalı; barkod varsa GTIN.
7. Google Business Profile: kategori Coffee Roaster / Kahve kavurma; adres, saat, telefon, WhatsApp, foto, ürünler, website.

Cloudflare Bot Fight, `/urunler` için challenge gösteriyorsa Googlebot allowlist şart. Ayrıntı: [deploy/README.md](../deploy/README.md).

## Keyword → sayfa

| Hedef | Sayfa |
|-------|--------|
| İzmir specialty, Ayrancılar kahve, Torbalı kahve | `/` + GBP |
| Türk kahvesi (taze kavrulmuş, çekirdek) | `/urunler/kategori/turk-kahvesi` |
| Filtre kahve çekirdeği | `/urunler/kategori/filtre-kahve` |
| Espresso çekirdeği | `/urunler/kategori/espresso` |
| Taze kavrulmuş / specialty kahve | blog köşe yazıları → kategori |

URL’ler `/urunler` kalır; `/kahveler` migrasyonu yok.

## Blog ağı (admin’de yayınlı)

Türk kahvesi 4’lü küme + filtre / espresso 4’lü küme (migration) + demleme köşe yazıları. Ürün slug’larını yazıya bağlayın:

### Türk kahvesi
1. Türk kahvesi nasıl demlenir?
2. Türk kahvesi öğütme inceliği
3. Türk kahvesi nasıl saklanır?
4. Türk kahvesi seçerken nelere bakmalı?

### Filtre kahve
5. Filtre kahve nasıl demlenir?
6. Filtre kahve öğütme inceliği
7. Filtre kahve nasıl saklanır?
8. Filtre kahve seçerken nelere bakmalı?
9. V60 nasıl yapılır? / French Press nasıl yapılır?

### Espresso
10. Espresso nasıl yapılır?
11. Espresso öğütme inceliği
12. Espresso çekirdeği nasıl saklanır?
13. Espresso çekirdeği seçerken nelere bakmalı? / Espresso için hangi çekirdek?
14. Moka pot nasıl kullanılır?

### Genel / GEO
15. Çekirdek kahve nedir? / Specialty coffee nedir?
16. Kahve kavurma dereceleri
17. İzmir’de taze kavrulmuş kahve / Torbalı–Ayrancılar kahve

Her yazıda ilgili ürün + kategori slug’ları dolu olmalı (`related_category_slugs` / `related_product_slugs`).

## Ürün / kategori metinleri

Admin → Ürünler: `seoTitle`, `seoDescription`, HTML açıklama (H2’ler), kavrum tarihi, demleme önerisi, saklama.
Admin → Kategoriler: 200–400 kelimelik benzersiz açıklama (Türk kahvesi / filtre / espresso migration’da doldurulur; diğerleri elle).

## Yerel ve off-site

- GBP yorum isteği: “Kahvelerimizi beğendiyseniz Google’da deneyiminizi paylaşabilir misiniz?” — kelime dayatma yok.
- PageSpeed / Search Console CWV: LCP adayı S3 hero (`AppImage` native img).
- Backlink: İzmir gastronomi, kahve blogları, yerel dizinler. Spam paket yok.

## Core Web Vitals notu

Ölçüm: PageSpeed Insights + GSC. Kod tarafında S3 görselleri CORS nedeniyle Next optimizer’dan geçmez; AVIF dönüşümü bu turda yok.
