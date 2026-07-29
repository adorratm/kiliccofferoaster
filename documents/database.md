# Başlangıç migration notu

Production'da `synchronize: false` kullanılır.

API açılışında `migrationsRun` otomatik açıktır (`DATABASE_SYNCHRONIZE=false` veya
`DATABASE_MIGRATIONS_RUN=true`). Deploy sonrası bekleyen migration'lar
`kiliccoffee-prod-api` ayağa kalkarken uygulanır — ekstra manuel adım gerekmez.

Migration sınıfları `api/src/database/migrations/index.ts` içinde listelenir
(Nest webpack build glob dosyalarını dist'e kopyalamadığı için).

Kapatmak için: `DATABASE_MIGRATIONS_RUN=false`

## Geliştirme

API `NODE_ENV !== production` iken entity'lerden şemayı otomatik oluşturur
(`synchronize: true`). Bu durumda migration otomatik çalışmaz.

## Production migration üretme

PostgreSQL ayaktayken:

```bash
yarn workspace @kilic/api migration:generate src/database/migrations/SyncSchema
yarn workspace @kilic/api migration:run
```

`data-source.ts` kök `.env` dosyasını okur.

Manuel (container içinde) çalıştırmak gerekirse:

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/.env \
  exec api node ../node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
```

## Seed

```bash
yarn workspace @kilic/api seed
```
