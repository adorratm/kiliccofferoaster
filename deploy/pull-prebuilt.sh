#!/usr/bin/env bash
# Pull CI-built images from GHCR and retag as kiliccoffee-prod-*:live.
# Building Next on the VPS starves shared nginx / sibling sites (502).
set -euo pipefail

TAG="${KILIC_IMAGE_TAG:?KILIC_IMAGE_TAG required (git sha)}"
PREFIX="${KILIC_IMAGE_PREFIX:-ghcr.io/adorratm/kiliccofferoaster}"

echo "==> Pull prebuilt images (tag=$TAG prefix=$PREFIX)"

# GHCR service name → local compose image (:live)
pull_one() {
  local svc="$1"
  local local_img="$2"
  local remote="${PREFIX}/${svc}:${TAG}"
  echo "--> $remote → ${local_img}:live"
  if ! docker pull "$remote"; then
    echo "ERROR: docker pull failed for $remote" >&2
    echo "If the error is 'denied': VPS needs a classic PAT (read:packages) as GHCR_TOKEN," >&2
    echo "and Package settings must grant that user read access." >&2
    echo "GITHUB_TOKEN from Actions often cannot pull GHCR from outside the runner." >&2
    exit 1
  fi
  docker tag "$remote" "${local_img}:live"
  docker tag "$remote" "${local_img}:${TAG}"
}

pull_one api kiliccoffee-prod-api
pull_one frontend kiliccoffee-prod-frontend
pull_one admin kiliccoffee-prod-admin

echo "==> Prebuilt images ready (:live tags)"
