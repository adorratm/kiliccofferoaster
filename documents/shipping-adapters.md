# Kargo adaptörleri

## Desteklenen firmalar

| Kod | Firma |
|-----|--------|
| `yurtici` | Yurtiçi Kargo |
| `kolay_gelsin` | Kolay Gelsin |
| `dhl` | DHL |
| `surat` | Sürat Kargo |
| `ptt` | PTT Kargo |
| `hepsijet` | HepsiJet |
| `trendyol_express` | Trendyol Express |

## Mimari

Her sağlayıcı `IShippingAdapter` arayüzünü uygular:

- `createShipment(order, credentials)`
- `trackShipment(trackingNumber, credentials)`

Admin panelinden `/kargo` sayfasında credentials JSON ve `is_enabled` yönetilir (`shipping_provider_configs` tablosu).

## Mock mod

Credentials boş veya provider kapalıysa adaptör sahte takip numarası üretir. Canlı API dokümanı ve anahtarlar eklendiğinde aynı arayüz üzerinden gerçek çağrı yapılır.

## Sipariş akışı

1. Ödeme başarılı
2. Admin sipariş detayında kargo firması seçer
3. `POST /shipping/shipments` etiket / tracking üretir
4. Müşteri `/takip/[kod]` ile sorgu yapar
