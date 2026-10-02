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
  docker pull "$remote"
  docker tag "$remote" "${local_img}:live"
  docker tag "$remote" "${local_img}:${TAG}"
}

pull_one api kiliccoffee-prod-api
pull_one frontend kiliccoffee-prod-frontend
pull_one admin kiliccoffee-prod-admin

echo "==> Prebuilt images ready (:live tags)"
