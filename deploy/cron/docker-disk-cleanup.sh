#!/usr/bin/env bash
# Docker build cache + kullanılmayan imajlar + systemd journal temizliği.
# Çalışan container imajlarına ve volume'lara dokunmaz.
#
# Manuel: sudo bash deploy/cron/docker-disk-cleanup.sh
set -euo pipefail

LOG_TAG="[disk-cleanup $(date -Is)]"

log() { echo "${LOG_TAG} $*"; }

if [[ "${EUID}" -ne 0 ]]; then
  echo "Root gerekli: sudo bash $0" >&2
  exit 1
fi

log "Başlıyor — disk öncesi:"
df -h / | tail -1

log "Docker build cache..."
docker builder prune -af 2>&1 | tail -3 || true

log "Kullanılmayan Docker imajları (yalnızca dangling; :live/:rollback korunur)..."
docker image prune -f 2>&1 | tail -3 || true

log "Systemd journal (max 200M)..."
journalctl --vacuum-size=200M 2>&1 | tail -3 || true

log "Docker özet:"
docker system df 2>/dev/null || true

log "Bitti — disk sonrası:"
df -h / | tail -1
