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

Çıktı: `desktop/release/KilicCoffee-Setup.exe`

## macOS (DMG)

Bir Mac’te:

```bash
yarn pack:desktop:mac
```

Çıktı: `desktop/release/KilicCoffee.dmg` (universal: Intel + Apple Silicon).

## Linux (AppImage / deb)

Linux makinede:

```bash
yarn pack:desktop:linux
```

Çıktı: `desktop/release/KilicCoffee.AppImage` ve `KilicCoffee.deb`. AppImage’i çalıştırılabilir yapın (`chmod +x`). Debian/Ubuntu için `.deb` kullanın.

Windows PC’den macOS paketi alınamaz. Gatekeeper uyarısı olmasın diye Apple Developer ID ile imza + notarize gerekir.

Dosyaları `frontend/public/downloads/` altına kopyalayın veya `NEXT_PUBLIC_DOWNLOAD_WINDOWS` / `NEXT_PUBLIC_DOWNLOAD_MAC` / `NEXT_PUBLIC_DOWNLOAD_LINUX` ile CDN verin. Vitrin `/indir` sayfası bu adresleri kullanır.

Paketlenmiş uygulama API için `https://api.kiliccoffeeroaster.com.tr` kullanır. Geliştirmede localhost.

Personel girişi: `POST /auth/ops-login`. Offline kuyruk yalnızca personel muhasebe ekranlarında (cari/fatura/stok).
