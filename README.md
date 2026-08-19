# Kılıç Coffee Roaster

Monorepo: NestJS API + Next.js vitrin + Next.js admin.

## Hızlı başlangıç

```bash
cp .env.example .env
docker compose up -d postgres
yarn install
yarn migration:run   # veya geliştirmede synchronize açık
yarn workspace @kilic/api seed
yarn dev:api
yarn dev:frontend
yarn dev:admin
yarn dev:desktop   # varsayılan pencere: mağaza
```

Windows kurulum: `yarn pack:desktop:win` → `desktop/release/KilicCoffee-Setup.exe`  
macOS (bir Mac’te): `yarn pack:desktop:mac` → `desktop/release/KilicCoffee.dmg`  
Linux: `yarn pack:desktop:linux` → `desktop/release/KilicCoffee.AppImage` / `.deb`  
Mobil: `cd mobile && npx eas-cli build -p android --profile preview` (APK)

Vitrin indirme sayfası: `/indir`

| Servis | URL |
|--------|-----|
| Vitrin | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API + Swagger | http://localhost:4000/docs |
| Masaüstü | `yarn dev:desktop` |
| Mobil | `yarn dev:mobile` |

Detaylı dokümantasyon: [`documents/`](documents/).

## Yapı

```
api/        NestJS + PostgreSQL + TypeORM (EntityManager)
frontend/   Müşteri sitesi
admin/      Yönetim paneli (Google OAuth allowlist)
desktop/    Electron mağaza + personel paneli
mobile/     Expo mağaza (WebView) + personel paneli
packages/   Ortak contracts ve UI token
design/     Stitch tasarım referansı
documents/  Kurulum ve entegrasyon
docker/     Dockerfile'lar
```

## Teknoloji

- Node / Yarn: Volta pin (kök `package.json`)
- Ödeme: iyzico
- Kargo adaptörleri: Yurtiçi, Kolay Gelsin, DHL, Sürat, PTT, HepsiJet, Trendyol Express
- Pazaryeri: Trendyol, Hepsiburada, N11
