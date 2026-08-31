#!/usr/bin/env bash
# Her 2 günde bir gece 00:00'da disk temizliği cron'u kurar (root).
#
# Sunucuda:
#   cd /opt/kiliccofferoaster   # veya DEPLOY_PATH
#   sudo bash deploy/cron/install-disk-cleanup-cron.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="${ROOT_DIR}/deploy/cron/docker-disk-cleanup.sh"
LOG="/var/log/docker-disk-cleanup.log"
CRON_SCHEDULE="0 0 */2 * *"
CRON_LINE="${CRON_SCHEDULE} ${SCRIPT} >> ${LOG} 2>&1"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Root gerekli: sudo bash $0" >&2
  exit 1
fi

chmod +x "${SCRIPT}"

touch "${LOG}"
chmod 644 "${LOG}"

# Mevcut aynı script satırını kaldır, yeniden ekle
tmp="$(mktemp)"
crontab -l 2>/dev/null | grep -Fv "${SCRIPT}" > "${tmp}" || true
echo "${CRON_LINE}" >> "${tmp}"
crontab "${tmp}"
rm -f "${tmp}"

echo "Cron kuruldu:"
echo "  ${CRON_LINE}"
echo ""
echo "Log: ${LOG}"
echo "Test: sudo bash ${SCRIPT}"
