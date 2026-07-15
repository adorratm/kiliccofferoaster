# Başlangıç migration notu

Production'da `synchronize: false` kullanılır.

## Geliştirme

API `NODE_ENV !== production` iken entity'lerden şemayı otomatik oluşturur.

## Production migration üretme

PostgreSQL ayaktayken:

```bash
yarn workspace @kilic/api migration:generate src/database/migrations/SyncSchema
yarn workspace @kilic/api migration:run
```

`data-source.ts` kök `.env` dosyasını okur.

## Seed

```bash
yarn workspace @kilic/api seed
```
