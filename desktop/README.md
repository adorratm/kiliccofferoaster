# Kılıç Coffee — masaüstü

Varsayılan pencere **personel paneli**dir (ön muhasebe). Mağaza vitrini menüden açılır: **Kılıç Coffee → Mağaza** (Windows’ta Alt).

```bash
yarn install
yarn dev:api
yarn dev:frontend   # mağaza (geliştirmede localhost:3000)
yarn dev:desktop
```

## Windows kurulum dosyası

```bash
yarn pack:desktop:win
```

Pack öncesi `icon.ico` otomatik üretilir (`scripts/make-desktop-ico.cjs`). Çıktı: `desktop/release/KilicCoffeeRoaster-Setup.exe`

## macOS (DMG)

Windows PC’den macOS paketi alınamaz. Bir Mac’te, Keychain’de geçerli **Developer ID Application** sertifikası olmalı.

İmza, isimdeki Türkçe karakter (`Ç`) yüzünden SHA-1 hash ile yapılır (`electron-builder.yml` + `scripts/mac-sign.cjs`). `CSC_NAME`’e sertifika **adını** yazma; gerekirse yalnızca 40 karakterlik hash.

### İmza + DMG

PowerShell:

```powershell
Remove-Item Env:CSC_NAME -ErrorAction SilentlyContinue
yarn pack:desktop:mac
```

İlk imzada macOS Keychain şifresi sorar (Mac oturum şifren). Mümkünse **Always Allow** seç; aksi halde her dosyada tekrar sorar.

Çıktı: `desktop/release/KilicCoffeeRoaster.dmg`

### Notarization (Gatekeeper)

İmza yetmez; başka Mac’lerde “geliştirici doğrulanamadı” olmasın diye Apple notarize gerekir. Pack öncesi shell’e:

| Değişken | Ne | Nereden |
|---|---|---|
| `APPLE_ID` | Developer hesabı e-postası | appleid.apple.com giriş e-postası |
| `APPLE_APP_SPECIFIC_PASSWORD` | Uygulamaya özel şifre (hesap şifresi değil) | [appleid.apple.com](https://appleid.apple.com) → Giriş ve Güvenlik → **Uygulamaya Özel Şifreler** |
| `APPLE_TEAM_ID` | 10 karakter Team ID | Sertifikadaki team (ör. `VPF2AW3724`) veya [developer.apple.com/account](https://developer.apple.com/account) → Membership |

```powershell
$env:APPLE_ID = "senin@email.com"
$env:APPLE_APP_SPECIFIC_PASSWORD = "xxxx-xxxx-xxxx-xxxx"
$env:APPLE_TEAM_ID = "VPF2AW3724"

Remove-Item Env:CSC_NAME -ErrorAction SilentlyContinue
yarn pack:desktop:mac
```

Bu değerleri repoya / `.env`’e koyma; yalnızca paketleyen makinenin shell’inde tut.

Başarı: logda `skipped macOS notarization` **olmamalı**; notarize + DMG tamamlanır.

## Linux (AppImage / deb)

Linux makinede:

```bash
yarn pack:desktop:linux
```

Çıktı: `desktop/release/KilicCoffeeRoaster.AppImage` ve `KilicCoffeeRoaster.deb`. AppImage’i çalıştırılabilir yapın (`chmod +x`). Debian/Ubuntu için `.deb` kullanın.

Dosyaları `frontend/public/downloads/` altına kopyalayın veya `NEXT_PUBLIC_DOWNLOAD_WINDOWS` / `NEXT_PUBLIC_DOWNLOAD_MAC` / `NEXT_PUBLIC_DOWNLOAD_LINUX` ile CDN verin. Vitrin `/indir` sayfası bu adresleri kullanır.

### Otomatik güncelleme (electron-updater)

Pack çıktısındaki installer ile birlikte `latest.yml` (Windows), `latest-mac.yml`, `latest-linux.yml` dosyalarını **aynı** `downloads/` dizinine koyun. Feed adresi: `https://kiliccoffeeroaster.com.tr/downloads/`.

Uygulama açılışta bu feed’i kontrol eder; Ayarlar → **Güncellemeleri kontrol et** ile manuel tetiklenir. macOS’ta otomatik kurulum için Developer ID imzası gerekir.

Paketlenmiş uygulama API için `https://api.kiliccoffeeroaster.com.tr` kullanır. Geliştirmede localhost.

Personel girişi: `POST /auth/ops-login`. Offline kuyruk yalnızca personel muhasebe ekranlarında (cari/fatura/stok).
