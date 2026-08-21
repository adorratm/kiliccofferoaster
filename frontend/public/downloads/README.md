# Masaüstü / mobil indirme dosyaları

Bu klasör **gitignore**’dadır (büyük binary’ler git’e girmez). Dosyaları sunucuya veya CDN’e manuel koyarsınız.

## Windows (şimdi)

```bash
yarn pack:desktop:win
# çıktı: desktop/release/KilicCoffeeRoaster-Setup.exe + latest.yml + .blockmap
```

Sunucuya örnek (Hetzner; yolu kendi `DEPLOY_PATH` / nginx root’unuza göre değiştirin):

```bash
scp desktop/release/KilicCoffeeRoaster-Setup.exe `
  desktop/release/KilicCoffeeRoaster-Setup.exe.blockmap `
  desktop/release/latest.yml `
  user@SUNUCU:/opt/kiliccofferoaster/frontend/public/downloads/
```

Alternatif: S3/CDN’e yükleyip env’de tam URL verin:

`NEXT_PUBLIC_DOWNLOAD_WINDOWS=https://cdn.../KilicCoffeeRoaster-Setup.exe`

Yerel vitrin testi için aynı dosyaları bu klasöre kopyalayabilirsiniz; commit etmeyin.

## macOS / Linux

- Mac: `yarn pack:desktop:mac` → `KilicCoffeeRoaster.dmg` + `latest-mac.yml`
- Linux (Linux/Docker): `yarn pack:desktop:linux` → `KilicCoffeeRoaster.AppImage` (+ `.deb`) + `latest-linux.yml`

Env: `NEXT_PUBLIC_DOWNLOAD_MAC` / `NEXT_PUBLIC_DOWNLOAD_LINUX`

## Otomatik güncelleme vs yeni kurulum

| Kim | Ne olur |
|-----|---------|
| **Zaten kurulu masaüstü uygulama** | Açılışta / Ayarlar’dan `latest.yml` kontrol eder; yeni sürüm varsa **kendi indirir ve kurar**. Kullanıcının `/indir`’e gitmesi gerekmez. |
| **Siz (geliştirici)** | Masaüstü sürümü yayınlamak için yine **yeni installer + latest.yml** üretir ve sunucuya koyarsınız. Electron’da JS OTA yok; her masaüstü release = yeni Setup.exe. |
| **Her commit / her frontend değişikliği** | Hayır — sadece masaüstü uygulamasını kullanıcıya göndermek istediğinizde pack + upload. Web/admin CI ile ayrı gider. |
| **Mobil (JS/asset)** | `eas update --channel production` — mağaza build’siz OTA. Native değişikliklerde yeniden `eas build`. |

Feed URL (sabit): `https://kiliccoffeeroaster.com.tr/downloads/`  
Installer ile `latest.yml` **aynı dizinde** ve aynı dosya adında olmalı.

Android APK / mağaza: `NEXT_PUBLIC_DOWNLOAD_ANDROID`, `NEXT_PUBLIC_PLAY_STORE_URL`, `NEXT_PUBLIC_APP_STORE_URL`.
