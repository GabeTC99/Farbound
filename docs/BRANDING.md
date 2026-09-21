# PWA / install icons

Home-screen and favicon art is the **Voidwake Studios / Nullharbor X profile** mark from Social Media Manager (teal four-point star), not the old Farbound “F”.

## Current source

- `dist/branding/x-profile.png` — X avatar as supplied (center-cropped to square if the drop is landscape)
- Rasterized to `dist/icon-192.png`, `dist/icon-512.png`, `dist/apple-touch-icon.png` (180), with matching `dist/classic/` copies
- `dist/icon.svg` wraps `icon-512.png` so leftover SVG favicon links still show the same mark
- Manifest `icons` list 192 + 512 PNG; HTML uses PNG favicon + apple-touch-icon

## Replace the avatar

1. Overwrite **`dist/branding/x-profile.png`** (or `.svg`) with a new square.
2. `python3 scripts/render-pwa-icons.py`
3. Bump `dist/release.mjs` and the `farbound-v…` cache in `dist/sw.js` so **Flight menu → Update** picks up the art.
