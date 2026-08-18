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

## Ön muhasebe / e-belge

| Değişken | Açıklama |
|----------|----------|
| `OPS_STAFF_EMAIL` | Seed staff e-posta |
| `OPS_STAFF_PASSWORD` | Seed staff şifre |
| `TURKCELL_ESIRKET_API_KEY` | Turkcell e-Şirket API anahtarı |
| `TURKCELL_ESIRKET_BASE_URL` | REST taban URL |
| `TURKCELL_ESIRKET_MOCK` | `true`/`false`; boşsa anahtar yoksa mock |
| `EXPO_PUBLIC_API_URL` | Mobil API adresi |

## OAuth

`GOOGLE_*`, `FACEBOOK_*`, `APPLE_*` — bkz. `auth.md`

## Ödeme

`IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL`

## Next.js

| Değişken | Kullanım |
|----------|----------|
| `NEXT_PUBLIC_API_URL` | Tarayıcıdan API |
| `NEXT_PUBLIC_SITE_URL` | Vitrin canonical (production’da https domain) |
| `NEXT_PUBLIC_ADMIN_URL` | Admin URL |
| `NEXT_PUBLIC_CDN_URL` | CDN preconnect (opsiyonel) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console meta doğrulama (opsiyonel) |
| `NEXT_PUBLIC_ADMIN_URL` | Admin URL |

Build zamanında `NEXT_PUBLIC_*` gömülür; Docker ARG olarak geçilir.
