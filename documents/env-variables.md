# Ortam değişkenleri

Kök `.env` (örnek: `.env.example`).

## Veritabanı

| Değişken | Açıklama |
|----------|----------|
| `POSTGRES_USER` | DB kullanıcısı |
| `POSTGRES_PASSWORD` | Şifre |
| `POSTGRES_DB` | Veritabanı adı |
| `DATABASE_HOST` | Host (`localhost` / Docker’da `postgres`) |
| `DATABASE_PORT` | Port |
| `DATABASE_URL` | TypeORM CLI / data-source |
| `DATABASE_SYNCHRONIZE` | `true`/`false`; boşsa dev’de sync açık |
| `DATABASE_MIGRATIONS_RUN` | `true`/`false`; boşsa sync kapalıysa migration çalışır |

## API

| Değişken | Açıklama |
|----------|----------|
| `API_PORT` | Dinleme portu |
| `API_URL` | Dış API URL |
| `JWT_SECRET` | JWT imza anahtarı |
| `JWT_EXPIRES_IN` | Süre (ör. `7d`) |
| `FRONTEND_URL` | CORS + OAuth yönlendirme |
| `ADMIN_URL` | CORS + admin redirect |
| `ADMIN_ALLOWLIST` | Virgülle e-postalar |
| `DESKTOP_DEV_URL` | Electron Vite origin (CORS) |
| `OPS_MOBILE_CALLBACK_URL` | Mobil ops OAuth (`kilicops://auth/callback`) |
| `OPS_WEB_URL` | Expo web origin |

## Redis / BullMQ

| Değişken | Açıklama |
|----------|----------|
| `REDIS_URL` | `redis://localhost:6379` |
| `REDIS_PORT` | Compose host portu |
| `BULL_BOARD_PATH` | Varsayılan `/admin/queues` |

Detay: [kuyruklar.md](kuyruklar.md).

## Ödeme

`PAYMENT_PROVIDER=paytr` \| `iyzico` (boş = PayTR bilgisi varsa paytr).

| Değişken | Açıklama |
|----------|----------|
| `PAYTR_MERCHANT_ID` / `KEY` / `SALT` | Mağaza paneli |
| `PAYTR_TEST_MODE` | `1` sandbox |
| `PAYTR_DEBUG_ON` | Debug |
| `IYZICO_API_KEY` / `SECRET_KEY` / `BASE_URL` | Yedek sağlayıcı |

Bildirim URL: `{API_URL}/payments/paytr/callback`. Detay: [payments-iyzico.md](payments-iyzico.md).

## E-posta / WhatsApp

| Değişken | Açıklama |
|----------|----------|
| `MAIL_FROM` / `MAIL_HOST` / `MAIL_PORT` / `MAIL_SECURE` / `MAIL_USER` / `MAIL_PASS` | SMTP |
| `ORDER_ALERT_EMAILS` | Sipariş admin bildirimi (virgülle). Boşsa info@ + `ADMIN_ALLOWLIST` |
| `WHATSAPP_PROVIDER` | `console` veya `meta` |
| `WHATSAPP_FROM` | E.164 |
| `META_WA_TOKEN` / `META_WA_PHONE_NUMBER_ID` | Cloud API |

Detay: [bildirimler.md](bildirimler.md).

## Sepet / stok / kargo

| Değişken | Açıklama |
|----------|----------|
| `TAX_RATE_PERCENT` / `TAX_INCLUDED` | Fiyatlandırma |
| `DEFAULT_SHIPPING_FEE` / `FREE_SHIPPING_OVER` | Kargo ücreti |
| `SHIPPING_ALLOW_MOCK` | Prod’da mock etiket (varsayılan kapalı) |
| `ABANDONED_CART_HOURS` | 1. hatırlatma (saat) |
| `ABANDONED_CART_SECOND_HOURS` | 2. hatırlatma |
| `LOW_STOCK_THRESHOLD` | Eşik |
| `LOW_STOCK_ALERT_EMAILS` | Ekstra alıcılar |
| `LOW_STOCK_SCAN_INTERVAL_HOURS` | Tarama aralığı |

## Pazaryeri

| Değişken | Açıklama |
|----------|----------|
| `MARKETPLACE_SYNC_ENABLED` | Otomatik sync |
| `MARKETPLACE_SYNC_INTERVAL_MINUTES` | Aralık (min 5) |
| `TRENDYOL_API_BASE_URL` | Stage/prod gateway |
| `HEPSIBURADA_LISTING_BASE_URL` / `HEPSIBURADA_OMS_BASE_URL` | HB |
| `N11_API_BASE_URL` / `N11_INTEGRATOR_NAME` | N11 |

## Ön muhasebe / e-belge

| Değişken | Açıklama |
|----------|----------|
| `OPS_STAFF_EMAIL` | Seed staff e-posta |
| `OPS_STAFF_PASSWORD` | Seed staff şifre |
| `TURKCELL_ESIRKET_API_KEY` | Turkcell e-Şirket API anahtarı |
| `TURKCELL_ESIRKET_BASE_URL` | REST taban URL |
| `TURKCELL_ESIRKET_MOCK` | `true`/`false`; boşsa anahtar yoksa mock |
| `EXPO_PUBLIC_API_URL` | Mobil API adresi |
| `EXPO_PUBLIC_SHOP_URL` | Mobil vitrin (deep link / WebView fallback) |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Android push |

## OAuth / App Links

`GOOGLE_*`, `FACEBOOK_*`, `APPLE_*` — bkz. [auth.md](auth.md)

| Değişken | Açıklama |
|----------|----------|
| `APPLE_CLIENT_ID` | Sign in with Apple — iOS bundle / Services ID (virgülle birden fazla) |
| `APPLE_TEAM_ID` | Universal Links AASA `appID` (TeamID.bundle) |
| `ANDROID_SHA256_FINGERPRINTS` | Play App Signing SHA-256 (virgülle, assetlinks.json) |

## S3 / CDN

`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_CDN_URL`.

## Next.js

| Değişken | Kullanım |
|----------|----------|
| `NEXT_PUBLIC_API_URL` | Tarayıcıdan API |
| `NEXT_PUBLIC_SITE_URL` | Vitrin canonical (production’da https domain) |
| `NEXT_PUBLIC_ADMIN_URL` | Admin URL |
| `NEXT_PUBLIC_CDN_URL` | CDN preconnect (opsiyonel) |
| `NEXT_PUBLIC_S3_BUCKET` / `NEXT_PUBLIC_S3_REGION` | Stok görsel fallback |
| `NEXT_PUBLIC_DOWNLOAD_WINDOWS` | Windows kurulum dosyası |
| `NEXT_PUBLIC_DOWNLOAD_MAC` | macOS DMG |
| `NEXT_PUBLIC_DOWNLOAD_LINUX` | Linux AppImage/deb |
| `NEXT_PUBLIC_DOWNLOAD_ANDROID` | Android APK |
| `NEXT_PUBLIC_PLAY_STORE_URL` | Play Store |
| `NEXT_PUBLIC_APP_STORE_URL` | App Store |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console meta doğrulama |
| `NEXT_PUBLIC_GA4_ID` | GA4 (Consent Mode; analytics onayı) |
| `NEXT_PUBLIC_GTM_ID` | GTM (doluysa doğrudan gtag atlanır) |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Ads AW-… (Consent Mode; etiket her zaman yüklenir) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel (çerez marketing) |

App Links runtime (vitrin container): `APPLE_TEAM_ID`, `ANDROID_SHA256_FINGERPRINTS` — bkz. [aso.md](aso.md). Merchant feed: `/feed/google-merchant.xml`.

Build zamanında `NEXT_PUBLIC_*` gömülür; Docker ARG olarak geçilir.
