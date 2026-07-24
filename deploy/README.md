# Production deploy — Hetzner (TTEN nginx ile paylaşımlı)

Bu stack `ttengamesstudio.com.tr` ve `emrekilic.web.tr` ile aynı VPS'te çalışır.

## Port planı

| Servis | Host port | Not |
|--------|-----------|-----|
| Frontend | **3200** | TTEN 3000 / Portfolio 3100 dışında |
| Admin | **3201** | Portfolio 3101 dışında |
| API | **3202** | TTEN 4000 / Portfolio 3102 dışında |
| Postgres | **5434** | Portfolio 5433 dışında |
| Redis | **6381** | Portfolio 6380 dışında |
| Edge | 80/443 | `ttengamesstudio-nginx` (paylaşımlı) |

## İlk kurulum (sunucu)

```bash
mkdir -p /opt/kiliccofferoaster
# İlk kez dosyaları scp/tar ile koyun veya GH Actions deploy çalıştırın

cd /opt/kiliccofferoaster
cp deploy/.env.production.example deploy/.env
nano deploy/.env   # secret'ları doldurun

bash deploy/setup-server.sh   # SSL + HTTP nginx
bash deploy/deploy.sh         # build + up + nginx sync
```

Cloudflare **Proxied** (turuncu bulut) ile Let's Encrypt HTTP-01 bazen başarısız olur.
Sertifika alırken geçici **DNS only** (gri bulut) yapın; sonra tekrar Proxied + SSL Full (strict).

## Veritabanı taşıma

Yerelde yedek zaten alındıysa:

```bash
# Yerel
scp deploy/artifacts/kiliccoffee-local.sql root@SUNUCU:/opt/kiliccofferoaster/deploy/artifacts/

# Sunucu
cd /opt/kiliccofferoaster
bash deploy/migrate-local-to-prod.sh import
```

Yeniden export:

```bash
bash deploy/migrate-local-to-prod.sh export
```

## GitHub Actions secrets

Portfolio ile aynı SSH anahtarını kullanabilirsiniz; `DEPLOY_PATH` farklı olmalı:

| Secret | Örnek |
|--------|--------|
| `SSH_HOST` | `46.62.128.115` |
| `SSH_USER` | `root` |
| `SSH_PRIVATE_KEY` | deploy key |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | `/opt/kiliccofferoaster` |

`deploy/.env` sunucuda kalır; Actions onu ezmez.

## Google OAuth

Authorized redirect URIs:

- `https://api.kiliccoffeeroaster.com.tr/auth/google/callback`
- `https://api.kiliccoffeeroaster.com.tr/auth/google/admin/callback`

## PayTR

Bildirim URL: `https://api.kiliccoffeeroaster.com.tr/payments/paytr/callback`

## Komutlar

```bash
bash deploy/deploy.sh
bash deploy/sync-tten-nginx.sh          # auto http/https
bash deploy/sync-tten-nginx.sh https
bash deploy/migrate-local-to-prod.sh export|import
```

## Host nginx 404 (acil)

Yanıt `Server: nginx/1.24.0 (Ubuntu)` ise Ubuntu host nginx 80/443’ü kapmıştır.
Edge her zaman Docker `ttengamesstudio-nginx` olmalı:

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
docker start ttengamesstudio-nginx
# veya: cd /opt/ttengamesstudio && docker compose up -d

curl -sI -H 'Host: ttengamesstudio.com.tr' http://127.0.0.1/ | head -5
curl -sI -H 'Host: emrekilic.web.tr' http://127.0.0.1/tr | head -5

cd /opt/portfolio && bash deploy/sync-tten-nginx.sh
cd /opt/kiliccofferoaster && bash deploy/sync-tten-nginx.sh
```
