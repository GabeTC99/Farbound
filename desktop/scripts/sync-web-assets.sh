#!/usr/bin/env bash
# Copy the authored web game into desktop/game (electron-builder extraResources).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$(cd "$ROOT/../dist" && pwd)"
DEST="$ROOT/game"
if [[ ! -f "$SRC/index.html" || ! -f "$SRC/app.js" ]]; then
  echo "dist/ is missing index.html or app.js — aborting." >&2
  exit 1
fi
rm -rf "$DEST"
mkdir -p "$DEST"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude '*.zip' --exclude '.git' --exclude 'sw.js' "$SRC/" "$DEST/"
else
  python3 - "$SRC" "$DEST" <<'PY'
import shutil, sys
from pathlib import Path
src, dest = Path(sys.argv[1]), Path(sys.argv[2])
def ignore(_dir, names):
    return [n for n in names if n.endswith('.zip') or n == '.git' or n == 'sw.js']
shutil.copytree(src, dest, dirs_exist_ok=True, ignore=ignore)
PY
fi
echo "Synced $SRC -> $DEST"
