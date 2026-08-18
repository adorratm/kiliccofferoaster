# Kılıç Coffee — mobil

Varsayılan ekran **mağazadır** (canlı vitrin). Personel paneli sağ üstteki **Personel** ile açılır; müşteri muhasebe/ürün menülerini görmez.

```bash
yarn install
yarn dev:api
yarn dev:mobile
```

Mağaza adresi: `EXPO_PUBLIC_SHOP_URL` (yoksa `https://kiliccoffeeroaster.com.tr`).

## Mağaza paketleri (EAS)

```bash
cd mobile
npx eas-cli login
npx eas-cli init          # bir kez; projectId app.json extra.eas altına yazılır
npx eas-cli build -p android --profile preview    # APK (site /indir)
npx eas-cli build -p android --profile production # Play Store AAB
npx eas-cli build -p ios --profile production
npx eas-cli submit -p android --profile production
npx eas-cli submit -p ios --profile production
```

Preview APK’yı `frontend/public/downloads/` altına koyup `NEXT_PUBLIC_DOWNLOAD_ANDROID` verin. Mağaza URL’lerini `NEXT_PUBLIC_PLAY_STORE_URL` / `NEXT_PUBLIC_APP_STORE_URL` ile `/indir` sayfasına bağlayın.

`eas.json` preview ve production profilleri canlı API/vitrin adreslerini basar.

Kapalı uygulamada Android push için EAS project id + `google-services.json` (FCM) gerekir.

Geliştirmede `EXPO_PUBLIC_API_URL` fiziksel cihazda LAN IP olmalıdır. Android emülatör varsayılanı `http://10.0.2.2:4000`.
