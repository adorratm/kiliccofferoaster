# Hetzner deployment

Bu proje `emrekilic.web.tr` ve `ttengamesstudio.com.tr` ile aynı VPS’e kurulacak şekilde tasarlandı.

## Sunucu hazırlığı

```bash
# örnek dizin
mkdir -p /opt/kiliccofferoaster
cd /opt/kiliccofferoaster
git clone https://github.com/adorratm/kiliccofferoaster.git .
cp .env.example .env
# .env içindeki secret, domain ve OAuth / iyzico değerlerini doldurun
```

## Docker Compose

```bash
docker compose build
docker compose up -d
```

Servisler:

- `postgres` — dahili ağ
- `api` — host `4000`
- `frontend` — host `3000`
- `admin` — host `3001`

Production’da `NODE_ENV=production` → synchronize kapalı. İlk ayağa kalkmadan önce migration:

```bash
docker compose run --rm api node -e "console.log('migrate via yarn in container')"
# veya API container içinde:
# yarn migration:run
```

Öneri: API Dockerfile’a giriş noktası olarak `migration:run && node dist/main.js` eklenebilir.

## Nginx örnek (mevcut sitelerin yanına)

```nginx
# kiliccoffeeroaster.com.tr
server {
  listen 443 ssl http2;
  server_name kiliccoffeeroaster.com.tr www.kiliccoffeeroaster.com.tr;
  # ssl_certificate ...;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 443 ssl http2;
  server_name admin.kiliccoffeeroaster.com.tr;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 443 ssl http2;
  server_name api.kiliccoffeeroaster.com.tr;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Caddy kullanıyorsanız benzer `reverse_proxy` blokları ekleyin; mevcut domain konfigürasyonuna dokunmayın.

## DNS

| Kayıt | Tip | Değer |
|-------|-----|--------|
| `@` / `www` | A | VPS IP |
| `admin` | A | VPS IP |
| `api` | A | VPS IP |

## SSL

Certbot veya Caddy otomatik TLS. Google / Facebook / Apple OAuth callback URL’lerini production domain’lere güncelleyin.

## Güvenlik notları

- `.env` dosyasını repoya commit etmeyin
- JWT_SECRET uzun rastgele string olsun
- Postgres portunu public açmayın (yalnızca Docker ağı)
- Admin yalnızca allowlist e-postası ile Google OAuth
