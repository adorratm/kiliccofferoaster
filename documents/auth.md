# Kimlik doğrulama

## Müşteri (frontend)

Yöntemler:

1. E-posta + şifre — `POST /auth/register`, `POST /auth/login`
2. Google — `GET /auth/google` → callback → JWT
3. Facebook — `GET /auth/facebook`
4. Apple — `GET /auth/apple`

JWT `Authorization: Bearer <token>` ile gönderilir. Frontend token’ı localStorage’da tutar.

## Admin

- Yalnızca Google OAuth: `GET /auth/google/admin`
- Callback: `GOOGLE_ADMIN_CALLBACK_URL`
- Kullanıcı e-postası şu kaynaklarda olmalıdır:
  - `ADMIN_ALLOWLIST` env (varsayılan: `emrekilic19983@gmail.com`)
  - veya `admin_allowlist` tablosu (seed ile eklenir)
- Başarılı girişte `role = admin`

## Google Cloud Console

1. OAuth 2.0 Client ID (Web) oluşturun
2. Authorized redirect URIs:
   - `http://localhost:4000/auth/google/callback`
   - `http://localhost:4000/auth/google/admin/callback`
   - Production: `https://api.kiliccoffeeroaster.com.tr/auth/google/callback`
   - Production admin: `https://api.kiliccoffeeroaster.com.tr/auth/google/admin/callback`
3. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` değerlerini `.env`’e yazın

## Facebook / Apple

İlgili developer konsollarından app kimliklerini alın; anahtarlar boşsa ilgili strategy stub/mock modunda durabilir (API ayağa kalkar, OAuth redirect çalışmaz).
