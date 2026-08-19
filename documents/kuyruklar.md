# Redis ve BullMQ kuyrukları

API, arka plan işleri için Redis + BullMQ kullanır. Yerelde:

```bash
docker compose up -d postgres redis
```

`REDIS_URL` (varsayılan `redis://localhost:6379`). Tam diyagram: [akislar.md](akislar.md).

## Kuyruklar

Tanım: `api/src/modules/queues/queue.constants.ts`.

| Kuyruk adı | Tetik | İş |
|------------|-------|-----|
| `notifications` | sipariş/kargo/şifre | E-posta, WhatsApp, inbox |
| `abandoned-cart` | scheduler | 1. ve 2. terk edilen sepet hatırlatması |
| `marketplace-sync` | scheduler + admin | Trendyol / HB / N11 stok ve sipariş |
| `shipping-poll` | scheduler | Kargo takip güncelleme → sipariş `delivered` |
| `low-stock` | scheduler | Eşik altı stok e-postası |
| `einvoice` | fatura gönder | Turkcell e-Şirket (veya mock) |

Scheduler env örnekleri: `MARKETPLACE_SYNC_ENABLED`, `MARKETPLACE_SYNC_INTERVAL_MINUTES` (min 5), `LOW_STOCK_SCAN_INTERVAL_HOURS`, `ABANDONED_CART_HOURS`.

## Bull Board

- Yol: `BULL_BOARD_PATH` (varsayılan `/admin/queues`).
- Yalnızca `role = admin` JWT. Admin paneli `/kuyruklar` üzerinden “Bull Board’u aç” linki token taşır.
- Cookie `kilic_bull_board` static asset isteklerinde token’ı korur.

## Geliştirme notları

- Redis yoksa API ayağa kalkabilir ama kuyruk job’ları fail log üretir; smoke §0 Redis ister.
- Production host Redis: `6381` (compose `kiliccoffee-prod-redis`); yalnızca localhost bind.
- Job retry: bildirimlerde 3 deneme, exponential backoff.

İlgili: [bildirimler.md](bildirimler.md), [marketplace-adapters.md](marketplace-adapters.md), [accounting.md](accounting.md).
