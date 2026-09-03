# Dokümantasyon indeksi

Türkçe anlatım; İngilizce terimler (JWT, checkout, EntityManager, BullMQ, PayTR) korunur.  
`/docs` = API Swagger UI (`http://localhost:4000/docs`). Bu klasör proje belgeleridir.

Başlangıç: [aşamalar](asamalar.md) (ne yaptık) → [akışlar](akislar.md) (nasıl çalışır) → konu sayfası.

## Hangi akış hangi dosyada

| Akış | Dosya |
|------|--------|
| Sistem bağlamı, monorepo | [architecture.md](architecture.md), [akislar.md](akislar.md) |
| Auth (müşteri / admin / ops) | [auth.md](auth.md) |
| Sepet, checkout, stok kilidi | [sepet-odeme.md](sepet-odeme.md) |
| PayTR / iyzico | [payments-iyzico.md](payments-iyzico.md) |
| Sipariş yaşam döngüsü | [akislar.md](akislar.md), [sepet-odeme.md](sepet-odeme.md) |
| Kargo + takip | [shipping-adapters.md](shipping-adapters.md) |
| Pazaryeri sync | [marketplace-adapters.md](marketplace-adapters.md) |
| Muhasebe / e-belge / offline sync | [accounting.md](accounting.md) |
| Redis / BullMQ | [kuyruklar.md](kuyruklar.md) |
| E-posta / WhatsApp / inbox / push | [bildirimler.md](bildirimler.md) |
| Deploy | [deployment-hetzner.md](deployment-hetzner.md), [deploy/README.md](../deploy/README.md) |

## Kurulum ve altyapı

| Dosya | Konu |
|-------|------|
| [setup-local.md](setup-local.md) | Yerel geliştirme |
| [docker.md](docker.md) | Docker Compose notları |
| [database.md](database.md) | PostgreSQL, migration, seed |
| [env-variables.md](env-variables.md) | Ortam değişkenleri |
| [kuyruklar.md](kuyruklar.md) | Redis + BullMQ kuyrukları |

## Mimari ve tarihçe

| Dosya | Konu |
|-------|------|
| [architecture.md](architecture.md) | Monorepo, EntityManager, alias, modüller |
| [asamalar.md](asamalar.md) | Proje aşamaları (ne yaptık) |
| [akislar.md](akislar.md) | Mermaid akış galerisi |

## Alışveriş

| Dosya | Konu |
|-------|------|
| [auth.md](auth.md) | OAuth, JWT, admin allowlist, ops-login |
| [sepet-odeme.md](sepet-odeme.md) | Sepet, checkout, abandoned cart |
| [payments-iyzico.md](payments-iyzico.md) | Ödeme (PayTR / iyzico) |
| [legal-pages.md](legal-pages.md) | Sözleşmeler ve çerez |

## Operasyon

| Dosya | Konu |
|-------|------|
| [shipping-adapters.md](shipping-adapters.md) | 7 kargo firması |
| [marketplace-adapters.md](marketplace-adapters.md) | Trendyol / HB / N11 |
| [accounting.md](accounting.md) | Ön muhasebe, e-belge, Electron / Expo |
| [bildirimler.md](bildirimler.md) | SMTP, WhatsApp, inbox, push |

## Yayın

| Dosya | Konu |
|-------|------|
| [deployment-hetzner.md](deployment-hetzner.md) | Docker + Nginx + domain |
| [aso.md](aso.md) | App Store / Play listing, App Links, Merchant feed |
| [seo.md](seo.md) | Organik SEO, GSC, GBP, keyword haritası |
| [smoke-checklist.md](smoke-checklist.md) | Canlı öncesi smoke kontrol listesi |

Paket README’leri: [desktop](../desktop/README.md), [mobile](../mobile/README.md), [deploy](../deploy/README.md).
