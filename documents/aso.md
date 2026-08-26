# ASO ve mağaza yayını

Public store müşteri uygulamasıdır (`Kılıç Coffee Roaster`). Personel sekmesi yalnızca ops JWT görünce çıkar. Mobil README: [mobile/README.md](../mobile/README.md).

## Kimlik

| Alan | Değer |
|------|--------|
| iOS bundle | `tr.kiliccoffeeroaster.ops` |
| Android package | `tr.kiliccoffeeroaster.ops` |
| Scheme | `kilicops://` |
| Site | `https://kiliccoffeeroaster.com.tr` |
| Gizlilik | https://kiliccoffeeroaster.com.tr/gizlilik |
| Destek | https://kiliccoffeeroaster.com.tr/iletisim |

## Store listing (TR)

**Başlık:** Kılıç Coffee Roaster  
**Kısa:** Torbalı / İzmir specialty kahve siparişi.  
**Uzun (taslak):** Taze kavrulmuş çekirdek, gramaj ve öğütme seçimi, güvenli ödeme, sipariş ve kargo takibi. İzmir Torbalı atölyesinden specialty coffee.

**Keywords (App Store, 100 karakter):** kahve,specialty coffee,kavrum,İzmir,Torbalı,çekirdek,filtre kahve,espresso

**Kategori:** Food & Drink / Alışveriş

## Universal / App Links

1. Apple Developer → App ID → Associated Domains + Sign in with Apple.
2. `.env` / prod: `APPLE_TEAM_ID=XXXXXXXXXX`
3. Play App Signing sertifikasının SHA-256 parmak izi: `ANDROID_SHA256_FINGERPRINTS=`
4. Canlıda kontrol:
   - `https://kiliccoffeeroaster.com.tr/.well-known/apple-app-site-association`
   - `https://kiliccoffeeroaster.com.tr/.well-known/assetlinks.json`
5. Native build (Expo prebuild) associatedDomains ve intentFilters için şart.

Deep link örnekleri (`/urunler/:slug`, `/takip/:kod`) native tab’lere düşer.

## Merchant / SEO

Ürün feed (Google): `https://kiliccoffeeroaster.com.tr/feed/google-merchant.xml`  
Ürün feed (Meta / Instagram Shop, varyantlı): `https://kiliccoffeeroaster.com.tr/feed/meta-catalog.xml`  
Google Merchant Center / Meta Commerce Manager’a ilgili URL’yi scheduled feed olarak ekleyin. Search Console: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

Vitrin `/sitemap.xml`, `/robots.txt`; özel sayfalar (`/hesabim`, `/odeme`, `/siparis-sorgula`) `noindex`.

## EAS / FCM

- `eas.json` submit hesaplarını doldurun.
- Android push: `google-services.json` (repoya koyulmaz) + `EXPO_PUBLIC_EAS_PROJECT_ID`.
- Screenshot: telefon 6.7" / 6.5", Play feature graphic 1024×500.
- Preview APK: `frontend/public/downloads/` + `NEXT_PUBLIC_DOWNLOAD_ANDROID`. Store URL: `NEXT_PUBLIC_PLAY_STORE_URL` / `NEXT_PUBLIC_APP_STORE_URL` → vitrin `/indir`.

## Sürüm

`mobile/app.json` ve `mobile/package.json` `1.0.0` ile hizalıdır. Store’a çıkarken `eas.json` `autoIncrement` kullanın.
