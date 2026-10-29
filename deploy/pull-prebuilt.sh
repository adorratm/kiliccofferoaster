#!/usr/bin/env bash
# Pull CI-built images from GHCR and retag as kiliccoffee-prod-*:live.
# Building Next on the VPS starves shared nginx / sibling sites (502).
# When CI already streamed images via docker save|load, set KILIC_SKIP_PULL=1.
set -euo pipefail

TAG="${KILIC_IMAGE_TAG:?KILIC_IMAGE_TAG required (git sha)}"
PREFIX="${KILIC_IMAGE_PREFIX:-ghcr.io/adorratm/kiliccofferoaster}"

if [[ "${KILIC_SKIP_PULL:-0}" == "1" ]]; then
  echo "==> Skip GHCR pull (images already on host, tag=$TAG)"
  for pair in \
    "api:kiliccoffee-prod-api" \
    "frontend:kiliccoffee-prod-frontend" \
    "admin:kiliccoffee-prod-admin"
  do
    local_img="${pair#*:}"
    if ! docker image inspect "${local_img}:live" >/dev/null 2>&1; then
      echo "ERROR: missing ${local_img}:live (expected after CI image transfer)" >&2
      exit 1
    fi
  done
  echo "==> Prebuilt images ready (:live tags, skipped pull)"
  exit 0
fi

echo "==> Pull prebuilt images (tag=$TAG prefix=$PREFIX)"

# GHCR service name → local compose image (:live)
pull_one() {
  local svc="$1"
  local local_img="$2"
  local remote="${PREFIX}/${svc}:${TAG}"
  echo "--> $remote → ${local_img}:live"
  if ! docker pull "$remote"; then
    echo "ERROR: docker pull failed for $remote" >&2
    echo "If the error is 'denied': add classic PAT (read:packages) as GHCR_TOKEN," >&2
    echo "or let CI stream images with docker save|load (no PAT needed)." >&2
    exit 1
  fi
  docker tag "$remote" "${local_img}:live"
  docker tag "$remote" "${local_img}:${TAG}"
}

pull_one api kiliccoffee-prod-api
pull_one frontend kiliccoffee-prod-frontend
pull_one admin kiliccoffee-prod-admin

echo "==> Prebuilt images ready (:live tags)"
