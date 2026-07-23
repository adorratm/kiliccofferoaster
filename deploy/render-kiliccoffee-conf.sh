#!/usr/bin/env bash
# deploy/ttengames/https/kiliccoffee.conf.template → TTEN templates/kiliccoffee.conf
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/.env"
TTEN_TPL="${TTEN_TEMPLATES:-/opt/ttengamesstudio/docker/nginx/templates}"
SSL_MODE="${1:-https}"

if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "${ENV_FILE}"
  set +a
fi

API_HOST="${KILIC_API_HOST:-kiliccoffee-prod-api}"
API_PORT="${KILIC_API_PORT:-4000}"
FRONTEND_HOST="${KILIC_FRONTEND_HOST:-kiliccoffee-prod-frontend}"
FRONTEND_PORT="${KILIC_FRONTEND_PORT:-3000}"
ADMIN_HOST="${KILIC_ADMIN_HOST:-kiliccoffee-prod-admin}"
ADMIN_PORT="${KILIC_ADMIN_PORT:-3001}"

src="${ROOT_DIR}/deploy/ttengames/${SSL_MODE}/kiliccoffee.conf.template"
dest="${TTEN_TPL}/kiliccoffee.conf"

if [[ ! -f "${src}" ]]; then
  echo "Hata: ${src} bulunamadı." >&2
  exit 1
fi

mkdir -p "${TTEN_TPL}"

sed \
  -e "s|@FRONTEND_HOST@|${FRONTEND_HOST}|g" \
  -e "s|@FRONTEND_PORT@|${FRONTEND_PORT}|g" \
  -e "s|@ADMIN_HOST@|${ADMIN_HOST}|g" \
  -e "s|@ADMIN_PORT@|${ADMIN_PORT}|g" \
  -e "s|@API_HOST@|${API_HOST}|g" \
  -e "s|@API_PORT@|${API_PORT}|g" \
  -e 's/\$\${/$/g' \
  "${src}" > "${dest}"

echo "${dest}"
