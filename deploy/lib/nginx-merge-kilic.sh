#!/usr/bin/env bash
# Kılıç Coffee nginx: ayrı conf.d dosyası (default.conf'a merge YOK)
set -euo pipefail

KILIC_CONF_D_BASENAME="${KILIC_CONF_D_BASENAME:-kiliccoffee.conf}"

wait_for_nginx_running() {
  local container="${1:?nginx container adı gerekli}"
  local max_attempts="${2:-90}"
  local attempt status

  for attempt in $(seq 1 "${max_attempts}"); do
    status="$(docker inspect -f '{{.State.Status}}' "${container}" 2>/dev/null || echo missing)"

    case "${status}" in
      running)
        if docker exec "${container}" true 2>/dev/null; then
          [[ "${attempt}" -gt 1 ]] && echo "  OK  ${container} hazır (${attempt}. deneme)"
          return 0
        fi
        ;;
      restarting)
        echo "  Bekleniyor... ${container} restarting (${attempt}/${max_attempts})"
        ;;
      exited|created)
        echo "  ${container} durmuş — başlatılıyor..."
        docker start "${container}" >/dev/null 2>&1 || true
        ;;
      missing)
        echo "  HATA: ${container} bulunamadı" >&2
        return 1
        ;;
      *)
        echo "  Bekleniyor... ${container} (${status}) (${attempt}/${max_attempts})"
        ;;
    esac
    sleep 2
  done

  echo "  HATA: ${container} ${max_attempts} denemede hazır olmadı (durum: ${status})" >&2
  return 1
}

recover_nginx_from_restart_loop() {
  local container="${1:?nginx container adı gerekli}"
  local tpl_host="${2:-}"

  echo "==> Nginx restart döngüsü — config host üzerinden yazılıyor..."
  docker stop "${container}" >/dev/null 2>&1 || true

  if [[ -n "${tpl_host}" && -f "${tpl_host}" ]]; then
    docker cp "${tpl_host}" "${container}:/etc/nginx/conf.d/${KILIC_CONF_D_BASENAME}"
    echo "  + docker cp → conf.d/${KILIC_CONF_D_BASENAME}"
  fi

  docker start "${container}" >/dev/null
  wait_for_nginx_running "${container}" 90
}

docker_exec_retry() {
  local container="$1"
  shift
  local attempt

  for attempt in $(seq 1 15); do
    if docker exec "${container}" "$@" 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

install_kilic_conf_d() {
  local container="${1:?nginx container adı gerekli}"
  local tpl_host="${2:-}"

  if wait_for_nginx_running "${container}" 20; then
    if docker_exec_retry "${container}" sh -c "
      set -e
      tpl=/etc/nginx/templates/kiliccoffee.conf
      dest=/etc/nginx/conf.d/${KILIC_CONF_D_BASENAME}
      if [ ! -f \"\$tpl\" ]; then
        echo 'kiliccoffee.conf template yok' >&2
        exit 1
      fi
      cp \"\$tpl\" \"\$dest\"
    "; then
      return 0
    fi
  fi

  if [[ -n "${tpl_host}" && -f "${tpl_host}" ]]; then
    recover_nginx_from_restart_loop "${container}" "${tpl_host}"
    return 0
  fi

  echo "kiliccoffee.conf yüklenemedi" >&2
  return 1
}

reload_nginx_if_valid() {
  local container="${1:?nginx container adı gerekli}"

  wait_for_nginx_running "${container}" 30 || return 1

  if docker exec "${container}" nginx -t 2>&1; then
    docker exec "${container}" nginx -s reload
    return 0
  fi
  return 1
}

apply_kilic_nginx_config() {
  local container="${1:?nginx container adı gerekli}"
  local tpl_host="${KILIC_CONF_HOST:-}"

  echo "==> Nginx container bekleniyor..."
  if ! wait_for_nginx_running "${container}" 60; then
    if [[ -n "${tpl_host}" && -f "${tpl_host}" ]]; then
      recover_nginx_from_restart_loop "${container}" "${tpl_host}"
    else
      return 1
    fi
  fi

  install_kilic_conf_d "${container}" "${tpl_host}"

  if reload_nginx_if_valid "${container}"; then
    return 0
  fi

  echo "UYARI: nginx -t başarısız — container yeniden başlatılıyor..."
  docker restart "${container}" >/dev/null
  wait_for_nginx_running "${container}" 90
  install_kilic_conf_d "${container}" "${tpl_host}"
  reload_nginx_if_valid "${container}"
}
