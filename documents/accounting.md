# Ön muhasebe ve e-belge

Masaüstü (`desktop/`, Electron) ve mobil (`mobile/`, Expo) mevcut NestJS API’ye bağlanır. Kaynak gerçekliği PostgreSQL’dir; cihazlar SQLite outbox ile çevrimdışı çalışır.

## Roller

`admin`, `staff`, `accountant` — `POST /auth/ops-login`. Müşteri hesapları reddedilir. Staff oluşturma: `POST /auth/ops-users` (yalnızca admin) veya seed `OPS_STAFF_EMAIL` / `OPS_STAFF_PASSWORD`.

## Uçlar

Önek: `/accounting` (Bearer, ops rolleri).

- Cari: `/parties`
- Faturalar: `/invoices` — taslak, kuyruk, gönder, iptal, HTML yazdırma
- Web siparişinden fatura: `POST /invoices/from-order/:orderId` (stok tekrar düşmez)
- Kasa: `/cash/accounts`, `/cash/entries`, `POST /cash/sync-paytr`
- Stok: `/stock`, `/stock/movements`
- ÖKC: `POST /okc/import` (CSV satırları; e-belge üretilmez)
- Raporlar: `/reports/turnover|vat|cash|stock`
- Senkron: `POST /sync/push`, `GET /sync/pull?since=`
- e-belge: `/einvoice/taxpayer/:vkn`, `/einvoice/inbox`

## Turkcell e-Şirket

`TURKCELL_ESIRKET_API_KEY` yoksa mock adapter kullanılır (GİB’e gitmez). Canlı anahtar sonrası `TURKCELL_ESIRKET_MOCK=false`.

## ÖKC

Beko X30TR satışları içeri alınır (fiş no, Z, nakit/kart). Mali fiş kasada kalır; aynı satış için e-arşiv kesilmez.

## Geliştirme

```bash
yarn dev:api
yarn dev:desktop
yarn dev:mobile
```
