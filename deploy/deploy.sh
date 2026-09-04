#!/usr/bin/env bash
# Zero-downtime dostu production deploy:
# 1) Snapshot running images → :rollback
# 2) Build new images → :live (eski container'lar eski image ID ile ayakta)
# 3) Migrate one-shot (fail → recreate YOK)
# 4) Rolling recreate + health; fail → :rollback ile geri dön
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/.env"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}")

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Hata: deploy/.env bulunamadı."
  echo "  cp deploy/.env.production.example deploy/.env"
  echo "  nano deploy/.env"
  exit 1
fi

wait_for_postgres() {
  local user="${1:-kilic}"
  local attempt status

  for attempt in $(seq 1 40); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' kiliccoffee-prod-postgres 2>/dev/null || echo missing)"
    if [[ "${status}" == "healthy" ]] \
      || "${COMPOSE[@]}" exec -T postgres pg_isready -U "${user}" >/dev/null 2>&1; then
      echo "Postgres hazır (${attempt}. deneme, durum: ${status})."
      return 0
    fi
    if [[ "${attempt}" -eq 40 ]]; then
      echo "Hata: Postgres 80s içinde healthy olmadı."
      docker logs kiliccoffee-prod-postgres --tail 40 2>&1 || true
      return 1
    fi
    sleep 2
  done
}

wait_for_url() {
  local url="${1}"
  local label="${2:-service}"
  local max_attempts="${3:-40}"
  local attempt=1

  while (( attempt <= max_attempts )); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      echo "${label} hazır (${attempt}. deneme)."
      return 0
    fi
    echo "${label} bekleniyor... (${attempt}/${max_attempts})"
    sleep 3
    ((attempt++))
  done

  echo "Hata: ${label} ${max_attempts} denemede ayağa kalkmadı."
  return 1
}

wait_for_container_healthy() {
  local cname="${1}"
  local label="${2:-$1}"
  local max_attempts="${3:-40}"
  local attempt=1
  local status

  while (( attempt <= max_attempts )); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${cname}" 2>/dev/null || echo missing)"
    if [[ "${status}" == "healthy" || "${status}" == "running" ]]; then
      # healthcheck yoksa running kabul; healthcheck varsa healthy şart
      if docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "${cname}" 2>/dev/null | grep -q .; then
        if [[ "${status}" == "healthy" ]]; then
          echo "${label} healthy (${attempt}. deneme)."
          return 0
        fi
      else
        echo "${label} running (${attempt}. deneme, healthcheck yok)."
        return 0
      fi
    fi
    if [[ "${status}" == "exited" || "${status}" == "dead" || "${status}" == "missing" ]]; then
      echo "${label} durum: ${status}"
    fi
    echo "${label} health bekleniyor... (${attempt}/${max_attempts}, ${status})"
    sleep 3
    ((attempt++))
  done

  echo "Hata: ${label} healthy olmadı."
  docker logs "${cname}" --tail 80 2>&1 || true
  return 1
}

ensure_swap() {
  local swap_mb
  swap_mb="$(free -m | awk '/Swap:/{print $2}')"
  if [[ "${swap_mb}" -ge 1024 ]]; then
    echo "Swap OK (${swap_mb}M)."
    return 0
  fi
  if [[ -f /swapfile ]]; then
    swapon /swapfile 2>/dev/null || true
    return 0
  fi
  if [[ "${EUID}" -ne 0 ]]; then
    echo "UYARI: Swap yok ve root değil — OOM riski yüksek."
    return 0
  fi
  echo "==> Swap yok — 2G /swapfile oluşturuluyor (OOM önleme)..."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
}

# Çalışan container'ın image ID'sini :rollback olarak sakla (build :live etiketini kaydırır).
snapshot_rollback() {
  local cname="${1}"
  local image_live="${2}"
  local image_rollback="${image_live%:live}:rollback"
  local img ref

  if ! docker inspect "${cname}" >/dev/null 2>&1; then
    echo "  (snapshot atlandı: ${cname} yok — ilk deploy?)"
    return 0
  fi

  tag_rollback() {
    local source="${1}"
    local label="${2}"
    if docker image inspect "${source}" >/dev/null 2>&1; then
      docker tag "${source}" "${image_rollback}"
      echo "  Rollback snapshot: ${image_rollback} ← ${label}"
      return 0
    fi
    return 1
  }

  img="$(docker inspect -f '{{.Image}}' "${cname}")"
  if tag_rollback "${img}" "${img:0:19}"; then
    return 0
  fi

  # prune sonrası .Image SHA silinmiş olabilir; container hâlâ ayaktadır
  ref="$(docker inspect -f '{{.Config.Image}}' "${cname}")"
  if tag_rollback "${ref}" "${ref}"; then
    return 0
  fi

  if tag_rollback "${image_live}" "${image_live}"; then
    return 0
  fi

  echo "  UYARI: ${cname} için rollback snapshot alınamadı (image silinmiş?). Deploy devam ediyor."
  return 0
}

rollback_service() {
  local service="${1}"
  local cname="${2}"
  local image_live="${3}"
  local image_rollback="${image_live%:live}:rollback"

  if ! docker image inspect "${image_rollback}" >/dev/null 2>&1; then
    echo "UYARI: ${image_rollback} yok — rollback yapılamadı."
    return 1
  fi

  echo "==> ROLLBACK: ${service} → ${image_rollback}"
  docker tag "${image_rollback}" "${image_live}"
  "${COMPOSE[@]}" up -d --no-deps --no-build --force-recreate "${service}"
  wait_for_container_healthy "${cname}" "${service}" 30 || true
}

rolling_recreate() {
  local service="${1}"
  local cname="${2}"
  local image_live="${3}"
  local url="${4:-}"

  echo "==> Recreate: ${service}"
  "${COMPOSE[@]}" up -d --no-deps --no-build --force-recreate "${service}"

  if ! wait_for_container_healthy "${cname}" "${service}" 40; then
    echo "Hata: ${service} unhealthy — rollback deneniyor."
    rollback_service "${service}" "${cname}" "${image_live}" || return 1
    return 1
  fi

  if [[ -n "${url}" ]]; then
    if ! wait_for_url "${url}" "${service} URL" 15; then
      echo "Hata: ${service} URL yanıt vermiyor — rollback."
      rollback_service "${service}" "${cname}" "${image_live}" || return 1
      return 1
    fi
  fi

  echo "OK: ${service}"
}

cd "${ROOT_DIR}"

echo "==> Kılıç Coffee production deploy: $(date -Is)"

export COMPOSE_PARALLEL_LIMIT=1
export DOCKER_BUILDKIT=1
export BUILDKIT_STEP_LOG_MAX_SIZE=10485760
export BUILDKIT_STEP_LOG_MAX_SPEED=10485760

ensure_swap

POSTGRES_USER="$(grep '^POSTGRES_USER=' "${ENV_FILE}" | cut -d= -f2)"
POSTGRES_USER="${POSTGRES_USER:-kilic}"
API_PORT="$(grep '^API_HOST_PORT=' "${ENV_FILE}" | cut -d= -f2)"
API_PORT="${API_PORT:-3202}"
FRONTEND_PORT="$(grep '^FRONTEND_HOST_PORT=' "${ENV_FILE}" | cut -d= -f2)"
FRONTEND_PORT="${FRONTEND_PORT:-3200}"
ADMIN_PORT="$(grep '^ADMIN_HOST_PORT=' "${ENV_FILE}" | cut -d= -f2)"
ADMIN_PORT="${ADMIN_PORT:-3201}"

echo "==> Postgres..."
"${COMPOSE[@]}" up -d postgres
wait_for_postgres "${POSTGRES_USER}"

echo "==> Redis..."
"${COMPOSE[@]}" up -d redis
if ! wait_for_container_healthy "kiliccoffee-prod-redis" "Redis" 30; then
  echo "Hata: Redis hazır olmadan devam edilemez."
  exit 1
fi

echo "==> Çalışan image snapshot (rollback)..."
snapshot_rollback kiliccoffee-prod-api kiliccoffee-prod-api:live
snapshot_rollback kiliccoffee-prod-frontend kiliccoffee-prod-frontend:live
snapshot_rollback kiliccoffee-prod-admin kiliccoffee-prod-admin:live

echo "==> Servisler sırayla build (RAM dostu; eski container'lar ayakta)..."
for service in api frontend admin; do
  echo "--- build: ${service} ($(date -Is))"
  echo "    free: $(free -m | awk '/Mem:/{print $7}')M available"
  "${COMPOSE[@]}" build "${service}"
  docker builder prune -f --keep-storage 2GB >/dev/null 2>&1 || true
done

echo "==> Migration one-shot (yeni api image; fail → container'lara dokunulmaz)..."
if ! "${COMPOSE[@]}" run --rm --no-deps --entrypoint node api dist/migrate.js; then
  echo ""
  echo "════════════════════════════════════════════════════"
  echo " MIGRATION BAŞARISIZ — canlı container'lar değiştirilmedi."
  echo " Site önceki sürümde ayakta kalmalı."
  echo " Logları düzeltip tekrar deploy edin."
  echo "════════════════════════════════════════════════════"
  exit 1
fi

echo "==> Rolling recreate..."
DEPLOY_OK=1

if ! rolling_recreate api kiliccoffee-prod-api kiliccoffee-prod-api:live \
  "http://127.0.0.1:${API_PORT}/health"; then
  DEPLOY_OK=0
fi

if [[ "${DEPLOY_OK}" -eq 1 ]]; then
  if ! rolling_recreate frontend kiliccoffee-prod-frontend kiliccoffee-prod-frontend:live \
    "http://127.0.0.1:${FRONTEND_PORT}/"; then
    DEPLOY_OK=0
  fi
fi

if [[ "${DEPLOY_OK}" -eq 1 ]]; then
  if ! rolling_recreate admin kiliccoffee-prod-admin kiliccoffee-prod-admin:live \
    "http://127.0.0.1:${ADMIN_PORT}/"; then
    DEPLOY_OK=0
  fi
fi

echo "==> Container durumu:"
"${COMPOSE[@]}" ps

if [[ "${DEPLOY_OK}" -ne 1 ]]; then
  echo ""
  echo "Deploy kısmen başarısız — rollback uygulandı veya denendi."
  echo "API health:"
  curl -fsS "http://127.0.0.1:${API_PORT}/health" || true
  echo ""
  exit 1
fi

echo "==> API health check (final)..."
wait_for_url "http://127.0.0.1:${API_PORT}/health" "API" 20

if docker network inspect "${KILIC_TTEN_NETWORK:-ttengamesstudio_ttengamesstudio-network}" >/dev/null 2>&1; then
  bash "${ROOT_DIR}/deploy/sync-tten-nginx.sh" || {
    echo "UYARI: Nginx sync coffee conf uygulayamadı — diğer siteler için:"
    echo "  bash deploy/recover-nginx.sh"
  }
else
  echo "UYARI: TTEN ağı yok — nginx sync atlandı."
fi

echo "Deploy tamamlandı (rolling + migrate ayrı): $(date -Is)"
