#!/usr/bin/env bash
# Run npm/node inside the official Node image (Node isn't required on the host).
# Usage: scripts/docker-npm.sh npm run build    |    scripts/docker-npm.sh node scripts/create-subject.mjs ...
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TTY_FLAGS=()
if [ -t 0 ] && [ -t 1 ]; then TTY_FLAGS=(-it); fi
exec docker run --rm "${TTY_FLAGS[@]}" \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp -e npm_config_cache=/tmp/.npm \
  -v "$ROOT":/app -w /app \
  ${PORTS:+-p "$PORTS"} \
  node:22-alpine "$@"
