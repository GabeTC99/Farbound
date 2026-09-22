#!/usr/bin/env bash
# Tag this commit so Android Release CI uploads the APK to GitHub Releases.
# Bump versionCode (and versionName when the player-facing build changes) first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME=$(grep -oP "versionName '\\K[^']+" "$ROOT/app/build.gradle" | head -1)
CODE=$(grep -oP "versionCode \\K[0-9]+" "$ROOT/app/build.gradle" | head -1)
TAG="android-v${NAME}"
echo "versionName=$NAME  versionCode=$CODE  tag=$TAG"
echo "Testers download: https://github.com/GabeTC99/Nullharbor/releases/latest/download/Nullharbor.apk"
if [[ "${1:-}" == "--publish" ]]; then
  git tag "$TAG"
  git push origin "$TAG"
  echo "Pushed $TAG. The Android Release workflow attaches the APK."
  exit 0
fi
cat <<EOF

To publish (preferred — CI signs with android/sideload.keystore):
  git tag $TAG
  git push origin $TAG

Also accepted: v${NAME}-android

Manual fallback if CI cannot upload (from android/ after assemble):
  ./assemble-debug.sh
  ./gradlew assembleRelease
  gh release create $TAG \\
    app/build/outputs/apk/release/app-release.apk#Nullharbor.apk \\
    app/build/outputs/apk/release/app-release.apk#nullharbor-${NAME}-vc${CODE}.apk \\
    --title "Nullharbor Android ${NAME} (versionCode ${CODE})" \\
    --notes "Sideload update: higher versionCode + same sideload key replaces the app. https://github.com/GabeTC99/Nullharbor/releases/latest/download/Nullharbor.apk"

EOF
