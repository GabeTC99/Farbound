#!/usr/bin/env bash
# Tag this commit so Windows Release CI uploads Nullharbor.exe to GitHub Releases.
# Bump desktop/package.json version (and dist/release.mjs) first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME=$(node -p "require('$ROOT/package.json').version")
TAG="windows-v${NAME}"
echo "version=$NAME  tag=$TAG"
echo "Testers download: https://github.com/GabeTC99/Nullharbor/releases/download/${TAG}/Nullharbor.exe"
echo "This release is NOT GitHub /releases/latest (that URL stays the newest Android APK)."
if [[ "${1:-}" == "--publish" ]]; then
  git tag "$TAG"
  git push origin "$TAG"
  echo "Pushed $TAG. The Windows Release workflow attaches the exe."
  exit 0
fi
cat <<EOF

To publish (preferred — CI builds a portable exe on windows-latest, unsigned):
  git tag $TAG
  git push origin $TAG

Also accepted: v${NAME}-windows

Windows may SmartScreen-warn on the unsigned build. There is no in-app updater —
download a newer windows-v* exe when you want an update. Saves stay in the
Electron userData folder (farbound-save-v2).

EOF
