#!/usr/bin/env bash
# .env dosyasını bash source etmeden güvenli yükle (< > boşluk vb. bozmaz)
load_env_file() {
  local file="${1:?env file}"
  local line key val

  if [[ ! -f "${file}" ]]; then
    echo "Hata: env dosyası yok: ${file}" >&2
    return 1
  fi

  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line%$'\r'}"
    [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]] && continue
    [[ "${line}" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    [[ "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ "${val}" =~ ^\"(.*)\"$ ]]; then
      val="${BASH_REMATCH[1]}"
    elif [[ "${val}" =~ ^\'(.*)\'$ ]]; then
      val="${BASH_REMATCH[1]}"
    fi
    printf -v "${key}" '%s' "${val}"
    export "${key}"
  done < "${file}"
}
