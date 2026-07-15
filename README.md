# Kılıç Coffee Roasters

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
```

| Servis | URL |
|--------|-----|
| Vitrin | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API + Swagger | http://localhost:4000/docs |

Detaylı dokümantasyon: [`documents/`](documents/).

## Yapı

```
api/        NestJS + PostgreSQL + TypeORM (EntityManager)
frontend/   Müşteri sitesi
admin/      Yönetim paneli (Google OAuth allowlist)
design/     Stitch tasarım referansı
documents/  Kurulum ve entegrasyon
docker/     Dockerfile'lar
```

## Teknoloji

- Node / Yarn: Volta pin (kök `package.json`)
- Ödeme: iyzico
- Kargo adaptörleri: Yurtiçi, Kolay Gelsin, DHL, Sürat, PTT, HepsiJet, Trendyol Express
- Pazaryeri: Trendyol, Hepsiburada, N11
