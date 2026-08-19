# Yerel kurulum

Windows, macOS ve Linux’ta aynı adımlar geçerlidir. Native modüller için Linux’ta `build-essential` (ve gerekirse `python3`) yeterlidir; Windows’ta Visual Studio Build Tools.

## Önkoşullar

- [Volta](https://volta.sh) ile Node.js ve Yarn (kök `package.json` pin’leri)
- [Docker Engine](https://docs.docker.com/engine/install/) (PostgreSQL için önerilir). Docker Desktop şart değil.

## Adımlar

1. Bağımlılıklar

```bash
cd kiliccofferoaster
yarn install
cp .env.example .env
```

2. PostgreSQL

```bash
docker compose up -d postgres
```

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

Seed içeriği: `ADMIN_ALLOWLIST` doluysa o e-posta admin allowlist’e yazılır; örnek ürünler, yasal belge taslakları, kargo provider kayıtları.

5. Servisleri başlat (ayrı terminaller)

```bash
yarn dev:api
yarn dev:frontend
yarn dev:admin
```

Masaüstü paket: `yarn pack:desktop:win` | `pack:desktop:mac` | `pack:desktop:linux`

Ops ikon üretimi (`scripts/generate-ops-icons.ps1`) yalnızca Windows’ta çalışır; PNG ikonlar repoda mevcuttir.

## Portlar

- API: 4000 — Swagger `/docs`
- Frontend: 3000
- Admin: 3001
- Postgres: 5432

## Alias kontrolü

Yeni dosyalarda `from '../...'` kullanmayın. IDE path mapping: her paketin kendi `tsconfig.json` dosyasında tanımlıdır.

## Smoke

Özellikleri hızlı doğrulamak için: [smoke-checklist.md](smoke-checklist.md).
