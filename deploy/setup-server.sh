#!/usr/bin/env bash
# İlk kurulum: dizin, .env, SSL (Let's Encrypt), nginx HTTP→HTTPS
#
# Sunucuda (root):
#   cd /opt/kiliccofferoaster
#   bash deploy/setup-server.sh
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/.env"
NGINX_CONTAINER="${NGINX_CONTAINER:-ttengamesstudio-nginx}"
DOMAINS=(
  kiliccoffeeroaster.com.tr
  www.kiliccoffeeroaster.com.tr
  admin.kiliccoffeeroaster.com.tr
  api.kiliccoffeeroaster.com.tr
)
EMAIL="${CERTBOT_EMAIL:-emrekilic19983@gmail.com}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Root gerekli: sudo bash $0"
  exit 1
fi

cd "${ROOT_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "==> deploy/.env oluşturuluyor..."
  cp deploy/.env.production.example deploy/.env
  echo "  DÜZENLE: nano deploy/.env  (JWT_SECRET, POSTGRES_PASSWORD, OAuth, PayTR...)"
  echo "  Sonra bu scripti tekrar çalıştırın veya deploy/deploy.sh kullanın."
fi

mkdir -p deploy/artifacts
chmod +x deploy/*.sh deploy/lib/*.sh 2>/dev/null || true

echo "==> HTTP nginx conf (ACME için)..."
bash deploy/sync-tten-nginx.sh http || true

if [[ ! -f /etc/letsencrypt/live/kiliccoffeeroaster.com.tr/fullchain.pem ]]; then
  echo "==> Let's Encrypt sertifikası alınıyor..."
  echo "    Cloudflare proxy AÇIKSA geçici olarak DNS-only (gri bulut) yapın,"
  echo "    veya Cloudflare Origin Certificate kullanın."
  echo ""

  certbot_args=(-d kiliccoffeeroaster.com.tr)
  for d in "${DOMAINS[@]}"; do
    [[ "${d}" == "kiliccoffeeroaster.com.tr" ]] && continue
    certbot_args+=(-d "${d}")
  done

  if command -v certbot >/dev/null 2>&1; then
    certbot certonly --webroot -w /var/www/certbot \
      --email "${EMAIL}" --agree-tos --no-eff-email \
      "${certbot_args[@]}" || {
        echo "UYARI: certbot başarısız. Cloudflare Flexible/Full ayarını ve DNS'i kontrol edin."
        echo "HTTP conf ile devam edilebilir; HTTPS için sertifika şart."
      }
  else
    echo "UYARI: certbot yok. Kurun: apt install certbot"
  fi
fi

if [[ -f /etc/letsencrypt/live/kiliccoffeeroaster.com.tr/fullchain.pem ]]; then
  echo "==> HTTPS nginx conf..."
  bash deploy/sync-tten-nginx.sh https
else
  echo "==> Sertifika yok — HTTP conf bırakıldı."
fi

echo ""
echo "Sonraki adımlar:"
echo "  1. nano ${ENV_FILE}"
echo "  2. bash deploy/deploy.sh"
echo "  3. (isteğe bağlı) bash deploy/migrate-local-to-prod.sh import"
echo "  4. Google OAuth redirect URI'lerini production URL'lere ekleyin"
echo "  5. PayTR bildirim URL: https://api.kiliccoffeeroaster.com.tr/payments/paytr/callback"
