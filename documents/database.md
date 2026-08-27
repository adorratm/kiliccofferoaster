# Veritabanı ve migration

Production'da `synchronize: false` kullanılır.

API açılışında `migrationsRun` otomatik açıktır (`DATABASE_SYNCHRONIZE=false` veya
`DATABASE_MIGRATIONS_RUN=true`). Deploy sonrası bekleyen migration'lar
`kiliccoffee-prod-api` ayağa kalkarken uygulanır — ekstra manuel adım gerekmez.

Migration sınıfları `api/src/database/migrations/index.ts` içinde listelenir
(Nest rspack build glob dosyalarını dist'e kopyalamadığı için).

Kapatmak için: `DATABASE_MIGRATIONS_RUN=false`

## Geliştirme

API `NODE_ENV !== production` iken entity'lerden şemayı otomatik oluşturur
(`synchronize: true`). Bu durumda migration otomatik çalışmaz.

## Kayıtlı migration’lar

| Timestamp | Sınıf | Özet |
|-----------|--------|------|
| 1770000… | `InitialSchema` | Placeholder (dev’de sync) |
| 1774000… | `AddOrderStockDecremented` | `orders.stock_decremented` |
| 1775000… | `NotificationChannelWhatsapp` | WhatsApp kanalı |
| 1776000… | `PasswordResetAndReturnRequests` | Şifre reset + `return_requests` |
| 1777000… | `GuestCartDeliveredAtReminders` | Misafir e-posta, 2. reminder, `delivered_at` |
| 1778000… | `CampaignsAndRefundAmount` | Kampanya + kısmi iade |
| 1779000… | `ProductSeoAndHomeFaq` | Ürün SEO + home FAQ |
| 1780000… | `ReplaceUnsplashWithStock` | Stok görselleri (S3) |
| 1781000… | `AboutPageSections` | Hakkımızda CMS |
| 1782000… | `AccountingAndCatalog` | `kind`/`unit`/`vat_rate`, ops roller, muhasebe tabloları |
| 1783000… | `InAppNotifications` | Inbox + push token |
| 1784000… | `FoodRetailCatalog` | Barkod, SKT, alerjen, `waste`, stok `numeric(12,3)` |
| 1785000… | `CategorySeo` | Kategori SEO alanları |

`FoodRetailCatalog` gıda perakende satışı için: ürün/varyant barkod ve `expires_at`; stok hareketi `waste` (fire); kasa çıkışında gider kategorisi.

## Production migration üretme

PostgreSQL ayaktayken:

```bash
yarn workspace @kilic/api migration:generate src/database/migrations/SyncSchema
yarn workspace @kilic/api migration:run
```

`data-source.ts` kök `.env` dosyasını okur. Yeni sınıfı `migrations/index.ts` içindeki `ALL_MIGRATIONS` dizisine ekleyin.

Manuel (container içinde) çalıştırmak gerekirse:

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/.env \
  exec api node ../node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
```

## Seed

```bash
yarn workspace @kilic/api seed
```
