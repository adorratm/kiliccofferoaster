#!/usr/bin/env bash
# Yerel DB yedeğini production'a taşır.
#
# Yerel (Windows Git Bash / WSL):
#   bash deploy/migrate-local-to-prod.sh export
#
# Sunucu:
#   bash deploy/migrate-local-to-prod.sh import
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="${ROOT_DIR}/deploy/artifacts"
ENV_FILE="${ROOT_DIR}/deploy/.env"
ROOT_ENV="${ROOT_DIR}/.env"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.prod.yml"

LOCAL_PG_HOST="${LOCAL_PG_HOST:-localhost}"
LOCAL_PG_PORT="${LOCAL_PG_PORT:-5432}"
LOCAL_PG_USER="${LOCAL_PG_USER:-}"
LOCAL_PG_PASSWORD="${LOCAL_PG_PASSWORD:-}"
LOCAL_PG_DB="${LOCAL_PG_DB:-kiliccoffeeroaster}"

PROD_PG_CONTAINER="${PROD_PG_CONTAINER:-kiliccoffee-prod-postgres}"

usage() {
  cat <<'EOF'
Kullanım:
  bash deploy/migrate-local-to-prod.sh export
  bash deploy/migrate-local-to-prod.sh import [--dump dosya.sql]

export  — Yerel Postgres yedeği (deploy/artifacts/kiliccoffee-local.sql)
import  — Production Postgres'e yükler

Ortam değişkenleri (export):
  LOCAL_PG_HOST LOCAL_PG_PORT LOCAL_PG_USER LOCAL_PG_PASSWORD LOCAL_PG_DB
EOF
}

load_root_env() {
  if [[ ! -f "${ROOT_ENV}" ]]; then
    return 0
  fi
  # shellcheck source=lib/load-env.sh
  source "${ROOT_DIR}/deploy/lib/load-env.sh"
  load_env_file "${ROOT_ENV}"
  LOCAL_PG_HOST="${LOCAL_PG_HOST:-${DATABASE_HOST:-localhost}}"
  LOCAL_PG_PORT="${LOCAL_PG_PORT:-${DATABASE_PORT:-5432}}"
  LOCAL_PG_USER="${LOCAL_PG_USER:-${POSTGRES_USER:-postgres}}"
  LOCAL_PG_PASSWORD="${LOCAL_PG_PASSWORD:-${POSTGRES_PASSWORD:-}}"
  LOCAL_PG_DB="${LOCAL_PG_DB:-${POSTGRES_DB:-kiliccoffeeroaster}}"
}

load_prod_env() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Hata: ${ENV_FILE} bulunamadı."
    exit 1
  fi
  # shellcheck source=lib/load-env.sh
  source "${ROOT_DIR}/deploy/lib/load-env.sh"
  load_env_file "${ENV_FILE}"
  POSTGRES_USER="${POSTGRES_USER:-kilic}"
  POSTGRES_DB="${POSTGRES_DB:-kiliccoffeeroaster}"
}

require_container() {
  local name="$1"
  if ! docker ps --format '{{.Names}}' | grep -qx "${name}"; then
    echo "Hata: ${name} container'ı çalışmıyor."
    exit 1
  fi
}

cmd_export() {
  local dump pg_dump_bin

  mkdir -p "${ARTIFACTS}"
  dump="${ARTIFACTS}/kiliccoffee-local.sql"
  load_root_env

  pg_dump_bin="$(command -v pg_dump || true)"
  if [[ -z "${pg_dump_bin}" ]]; then
    for candidate in \
      "/c/Program Files/PostgreSQL/18/bin/pg_dump" \
      "/c/Program Files/PostgreSQL/17/bin/pg_dump" \
      "/c/Program Files/PostgreSQL/16/bin/pg_dump"; do
      if [[ -x "${candidate}" ]]; then
        pg_dump_bin="${candidate}"
        break
      fi
    done
  fi

  if [[ -z "${pg_dump_bin}" ]]; then
    echo "Hata: pg_dump bulunamadı. PostgreSQL client tools kurun."
    exit 1
  fi

  if [[ -z "${LOCAL_PG_PASSWORD}" ]]; then
    echo "Hata: LOCAL_PG_PASSWORD / .env POSTGRES_PASSWORD gerekli."
    exit 1
  fi

  echo "==> Yerel PostgreSQL dışa aktarılıyor..."
  echo "    host=${LOCAL_PG_HOST} port=${LOCAL_PG_PORT} user=${LOCAL_PG_USER} db=${LOCAL_PG_DB}"

  PGPASSWORD="${LOCAL_PG_PASSWORD}" "${pg_dump_bin}" \
    -h "${LOCAL_PG_HOST}" \
    -p "${LOCAL_PG_PORT}" \
    -U "${LOCAL_PG_USER}" \
    -d "${LOCAL_PG_DB}" \
    --format=plain \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    -f "${dump}"

  echo "  + ${dump}"
  echo ""
  echo "Sonraki adım:"
  echo "  scp ${dump} root@SUNUCU_IP:/opt/kiliccofferoaster/deploy/artifacts/"
  echo "  ssh root@SUNUCU_IP 'cd /opt/kiliccofferoaster && bash deploy/migrate-local-to-prod.sh import'"
}

cmd_import() {
  local dump="${ARTIFACTS}/kiliccoffee-local.sql"
  if [[ "${1:-}" == "--dump" ]]; then
    dump="$2"
  fi

  if [[ ! -f "${dump}" ]]; then
    echo "Hata: yedek bulunamadı: ${dump}"
    exit 1
  fi

  load_prod_env
  require_container "${PROD_PG_CONTAINER}"

  echo "==> Uygulama container'ları durduruluyor..."
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" stop api frontend admin 2>/dev/null || true

  echo "==> Production DB yükleniyor (${dump})..."
  docker cp "${dump}" "${PROD_PG_CONTAINER}:/tmp/kiliccoffee-import.sql"

  docker exec "${PROD_PG_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();"

  docker exec "${PROD_PG_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
    "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
  docker exec "${PROD_PG_CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
    "CREATE DATABASE ${POSTGRES_DB};"

  # PG17+ \restrict satırlarını PG uyumluluğu için yok say (psql hata vermez çoğu sürümde)
  docker exec "${PROD_PG_CONTAINER}" psql \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -v ON_ERROR_STOP=1 \
    -f /tmp/kiliccoffee-import.sql

  docker exec "${PROD_PG_CONTAINER}" rm -f /tmp/kiliccoffee-import.sql

  echo "==> Uygulama container'ları başlatılıyor..."
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d api frontend admin

  if docker network inspect "${KILIC_TTEN_NETWORK:-ttengamesstudio_ttengamesstudio-network}" >/dev/null 2>&1; then
    bash "${ROOT_DIR}/deploy/sync-tten-nginx.sh" || true
  fi

  echo ""
  echo "Import tamamlandı."
  echo "  curl -s http://127.0.0.1:${API_HOST_PORT:-3202}/health"
}

main() {
  local cmd="${1:-}"
  shift || true

  case "${cmd}" in
    export) cmd_export "$@" ;;
    import) cmd_import "$@" ;;
    -h|--help|help|"") usage ;;
    *)
      echo "Bilinmeyen komut: ${cmd}"
      usage
      exit 1
      ;;
  esac
}

main "$@"
