#!/usr/bin/env bash
# Docker disk temizliği — paylaşımlı Hetzner (5 site).
#
# Varsayılan (güvenli):
#   - dangling imajlar
#   - build cache
#   - journal ≤200M
#   - kullanılmayan etiketli imajlar, AMA şunlar KORUNUR:
#       * herhangi bir container'ın kullandığı imaj ID
#       * :live / :rollback / :previous / :blue / :green etiketleri
#
# Agresif (daha fazla yer):
#   sudo bash deploy/cron/docker-disk-cleanup.sh --aggressive
#   → docker image prune -af (container kullanmayan HER şey gider;
#     :rollback da gider çünkü container bağlı değildir)
#
# Manuel: sudo bash deploy/cron/docker-disk-cleanup.sh
# Dry-run: sudo bash deploy/cron/docker-disk-cleanup.sh --dry-run
set -euo pipefail

LOG_TAG="[disk-cleanup $(date -Is)]"
MODE="safe"
DRY_RUN=0

log() { echo "${LOG_TAG} $*"; }

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \?//'
  exit 0
}

for arg in "$@"; do
  case "$arg" in
    --aggressive|-a) MODE="aggressive" ;;
    --dry-run|-n) DRY_RUN=1 ;;
    -h|--help) usage ;;
  esac
done

if [[ "${EUID}" -ne 0 ]]; then
  echo "Root gerekli: sudo bash $0" >&2
  exit 1
fi

log "Başlıyor (mode=${MODE} dry-run=${DRY_RUN}) — disk öncesi:"
df -h / | tail -1

log "Docker build cache..."
if [[ "${DRY_RUN}" -eq 1 ]]; then
  docker builder du 2>/dev/null | tail -5 || true
else
  docker builder prune -af 2>&1 | tail -5 || true
fi

# Container'ların kullandığı image ID'leri (sha256:... veya kısa id)
collect_used_ids() {
  docker ps -aq 2>/dev/null | while read -r cid; do
    [[ -z "$cid" ]] && continue
    docker inspect -f '{{.Image}}' "$cid" 2>/dev/null || true
  done | sort -u
}

# Korunan tag pattern (kilic live/rollback, hydrorage blue/green vb.)
is_protected_ref() {
  local ref="$1"
  case "$ref" in
    *:live|*:rollback|*:previous|*:blue|*:green) return 0 ;;
    *"<none>"*) return 1 ;;
  esac
  return 1
}

prune_unused_tagged_safe() {
  local used_file remove_count
  used_file="$(mktemp)"
  collect_used_ids >"${used_file}"
  remove_count=0

  log "Kullanılmayan etiketli imajlar (container + :live/:rollback korunur)..."
  # Format: repo:tag ID
  while IFS=$'\t' read -r ref id; do
    [[ -z "${ref}" || -z "${id}" ]] && continue
    [[ "${ref}" == *":<none>" ]] && continue

    if is_protected_ref "${ref}"; then
      continue
    fi

    # ID veya uzun digest container'da kullanılıyor mu?
    if grep -qF "${id}" "${used_file}" 2>/dev/null; then
      continue
    fi
    # Bazen inspect Image=sha256:full — kısa id de kontrol
    if grep -qE "^sha256:${id}|${id}" "${used_file}" 2>/dev/null; then
      continue
    fi

    # Yalnızca bizim GHCR / lokal prod imajları (rastgele alpine base'e dokunma opsiyonel)
    # Agresif değilsek de unused tag'leri temizle — base image'lar da container kullanıyorsa zaten korunur.
    if [[ "${DRY_RUN}" -eq 1 ]]; then
      echo "  [dry-run] rmi ${ref} (${id})"
    else
      if docker rmi "${ref}" 2>/dev/null; then
        echo "  - silindi: ${ref}"
        remove_count=$((remove_count + 1))
      fi
    fi
  done < <(docker images --format '{{.Repository}}:{{.Tag}}\t{{.ID}}' 2>/dev/null)

  # Dangling (<none>)
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    docker images -f dangling=true --format '  [dry-run] dangling {{.ID}}' 2>/dev/null || true
  else
    docker image prune -f 2>&1 | tail -3 || true
  fi

  log "Etiketli silinen (yaklaşık): ${remove_count}"
  rm -f "${used_file}"
}

if [[ "${MODE}" == "aggressive" ]]; then
  log "AGRESİF: container kullanmayan tüm imajlar (rollback tag'leri de gider)..."
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    docker image prune -a --filter "until=0s" 2>&1 | head -5 || \
      echo "  (dry-run: docker image prune -af çalıştırılacak)"
  else
    docker image prune -af 2>&1 | tail -5 || true
  fi
else
  prune_unused_tagged_safe
fi

log "Systemd journal (max 200M)..."
if [[ "${DRY_RUN}" -eq 0 ]]; then
  journalctl --vacuum-size=200M 2>&1 | tail -3 || true
fi

log "Docker özet:"
docker system df 2>/dev/null || true

log "Bitti — disk sonrası:"
df -h / | tail -1

if [[ "${MODE}" == "safe" ]]; then
  echo
  echo "Daha fazla yer için (rollback imajları da silinir):"
  echo "  sudo bash $0 --aggressive"
fi
