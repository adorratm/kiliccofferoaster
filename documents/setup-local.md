# Yerel kurulum

Windows, macOS ve Linux’ta aynı adımlar geçerlidir. Native modüller için Linux’ta `build-essential` (ve gerekirse `python3`) yeterlidir; Windows’ta Visual Studio Build Tools.

## Önkoşullar

- [Volta](https://volta.sh) ile Node.js ve Yarn (kök `package.json` pin’leri)
- [Docker Engine](https://docs.docker.com/engine/install/) (PostgreSQL + Redis için önerilir). Docker Desktop şart değil.

## Adımlar

1. Bağımlılıklar

```bash
cd kiliccofferoaster
yarn install
cp .env.example .env
```

2. PostgreSQL ve Redis

```bash
docker compose up -d postgres redis
```

Kuyruklar (abandoned cart, pazaryeri sync, bildirim) Redis olmadan fail log üretir.

3. Şema

Geliştirmede API ayağa kalkınca TypeORM `synchronize` entity’leri oluşturur.

Production tarzı migration:

```bash
yarn migration:run
```

4. Seed verisi

```bash
yarn workspace @kilic/api seed
```

Seed içeriği: `ADMIN_ALLOWLIST` doluysa o e-posta admin allowlist’e yazılır; `OPS_STAFF_EMAIL` / `OPS_STAFF_PASSWORD` doluysa staff hesabı; örnek ürünler, yasal belge taslakları, kargo provider kayıtları, PayTR kasa hesabı.

5. Servisleri başlat (ayrı terminaller)

```bash
yarn dev:api
yarn dev:frontend
yarn dev:admin
yarn dev:desktop   # personel paneli; mağaza menüden
yarn dev:mobile    # native mağaza; personel sekmesi ops JWT ile
```

Masaüstü paket: `yarn pack:desktop:win` | `pack:desktop:mac` | `pack:desktop:linux`

Installer + `latest*.yml` dosyalarını `frontend/public/downloads/` (veya CDN) altına koyun; masaüstü uygulama buradan otomatik güncellenir. Mobil OTA: `cd mobile && npx eas-cli update --channel production`.

Ops ikon üretimi (`scripts/generate-ops-icons.ps1`) yalnızca Windows’ta çalışır; PNG ikonlar repoda mevcuttir.

## Portlar

- API: 4000 — Swagger `/docs`
- Frontend: 3000
- Admin: 3001
- Desktop Vite: 5173 (`DESKTOP_DEV_URL`)
- Postgres: 5432
- Redis: 6379

## Alias kontrolü

Yeni dosyalarda `from '../...'` kullanmayın. IDE path mapping: her paketin kendi `tsconfig.json` dosyasında tanımlıdır.

## Smoke

Özellikleri hızlı doğrulamak için: [smoke-checklist.md](smoke-checklist.md).
