#!/usr/bin/env bash
# Sideload-signed release APK (same key as debug; not Play Store).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
"$ROOT/scripts/sync-web-assets.sh"
exec "$ROOT/gradlew" assembleRelease --no-daemon "$@"
