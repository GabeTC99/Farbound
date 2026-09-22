#!/usr/bin/env bash
# GitHub-hosted runners already have an Android SDK. Accept licenses so Gradle
# can download platform 35 / build-tools. Do not install the obsolete `tools` package.
set -euo pipefail
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/local/lib/android/sdk}}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
SM=""
for candidate in \
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" \
  "$ANDROID_HOME/cmdline-tools/16.0/bin/sdkmanager" \
  "$ANDROID_HOME/cmdline-tools/13.0/bin/sdkmanager" \
  "$ANDROID_HOME/cmdline-tools/bin/sdkmanager"; do
  if [[ -x "$candidate" ]]; then SM="$candidate"; break; fi
done
if [[ -z "$SM" ]]; then
  echo "sdkmanager not found under $ANDROID_HOME" >&2
  ls -la "$ANDROID_HOME/cmdline-tools" >&2 || true
  exit 1
fi
yes | "$SM" --licenses >/dev/null || true
echo "sdk.dir=$ANDROID_HOME" > "$(cd "$(dirname "$0")/.." && pwd)/local.properties"
echo "ANDROID_HOME=$ANDROID_HOME"
"$SM" --version || true
