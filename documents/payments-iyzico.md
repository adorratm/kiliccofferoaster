# iyzico ödeme

Abonelik yoktur; sepet üzerinden tek seferlik ödeme.

## Ortam değişkenleri

```
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

Production base URL: `https://api.iyzipay.com`

## Akış

1. Checkout’ta sipariş oluşturulur (`PENDING_PAYMENT`)
2. `POST /payments/initialize` → iyzico Checkout Form / token
3. Kullanıcı ödeme sayfası / form
4. Callback / webhook → `Payment.status = success`, `Order.status = paid`
5. Stok düşümü sipariş onayında

## Geliştirme (anahtar yok)

API anahtarları boşsa servis **mock token** döner; böylece uçtan uca akış UI’da test edilebilir. Canlıya almadan önce sandbox anahtarlarıyla doğrulayın.

## Endpoint’ler

- `POST /payments/initialize` — sipariş için ödeme başlat
- `POST /payments/callback` — iyzico dönüşü (public)

Detaylı alanlar Swagger `/docs` altında.
