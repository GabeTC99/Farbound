#!/usr/bin/env bash
# Build a sideload debug APK: sync dist/ → assets, then assembleDebug.
# Requires JDK 17+ and Android SDK 35. Set ANDROID_HOME or create local.properties.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
"$ROOT/scripts/sync-web-assets.sh"
if [[ ! -x "$ROOT/gradlew" ]]; then
  echo "Missing android/gradlew. From this directory run: gradle wrapper --gradle-version 8.9" >&2
  exit 1
fi
exec "$ROOT/gradlew" assembleDebug --no-daemon "$@"
