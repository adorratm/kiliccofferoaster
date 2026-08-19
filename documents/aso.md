# ASO ve mağaza yayını

Public store müşteri uygulamasıdır (`Kılıç Coffee Roaster`). Personel sekmesi yalnızca ops JWT görünce çıkar.

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

## Merchant / SEO

Ürün feed: `https://kiliccoffeeroaster.com.tr/feed/google-merchant.xml`  
Google Merchant Center’a bu URL’yi ekleyin. Search Console: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

## EAS / FCM

- `eas.json` submit hesaplarını doldurun.
- Android push: `google-services.json` (repoya koyulmaz).
- Screenshot: telefon 6.7" / 6.5", Play feature graphic 1024×500.

## Sürüm

`mobile/app.json` ve `mobile/package.json` `1.0.0` ile hizalıdır. Store’a çıkarken `eas.json` `autoIncrement` kullanın.
