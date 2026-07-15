# Pazaryeri adaptörleri

## Platformlar

| Kod | Platform |
|-----|----------|
| `trendyol` | Trendyol Marketplace |
| `hepsiburada` | Hepsiburada Merchant |
| `n11` | N11 |

## Arayüz

`IMarketplaceAdapter`:

- `pushProduct` — ürün / listing oluştur-güncelle
- `syncStock` — stok senkronu
- `pullOrders` — pazaryeri siparişlerini çekme

Hesap bilgileri `marketplace_accounts` tablosunda; admin `/pazaryeri` ekranından yönetilir.

## Sync

Admin “Senkronize” tetiklemesi `last_sync_at` / `last_sync_status` günceller. Credentials yoksa mock başarı durumu döner.

## Canlıya alma

1. Satıcı panellerinden API anahtarlarını alın
2. Admin’e kaydedin, `is_enabled = true`
3. Ürün listing eşlemesi (`marketplace_listings`)
4. Stok senkronunu test edin
5. Sipariş çekme job’unu (manuel sync → ileride cron) doğrulayın

Her platformun resmi API dokümantasyonundaki rate limit ve zorunlu alanlara uyun.
