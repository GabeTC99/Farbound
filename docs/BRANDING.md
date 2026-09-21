# PWA / install icons

Home-screen and favicon art should be the **Voidwake Studios / Nullharbor X profile icon** from Social Media Manager — not the old Farbound “F” mark, and not a newly invented logo.

## Current placeholder

Until that square PNG/SVG is in this repo, the PWA uses the official Voidwake Studios mark already shipping on the marketing site:

- Source: `GabeTC99/voidwake-site` → `public/favicon.svg` (gold ring, wake line, ice-blue body)
- Copied into `dist/icon.svg` and rasterized to `dist/icon-192.png`, `dist/icon-512.png`, and `dist/apple-touch-icon.png` (classic/ copies match)

## TODO — drop in the X profile icon

When Social Media Manager has a square Nullharbor/Voidwake **X profile** PNG or SVG:

1. Save it as **`dist/branding/x-profile.png`** (preferred) or **`dist/branding/x-profile.svg`**. Square, no extra UI chrome.
2. From the repo root: `python3 scripts/render-pwa-icons.py`
3. Confirm `dist/icon.svg`, `dist/icon-192.png`, `dist/icon-512.png`, `dist/apple-touch-icon.png`, and the `dist/classic/` copies updated.
4. Bump `dist/release.mjs` and the `farbound-v…` cache in `dist/sw.js` so Pages / **Flight menu → Update** pick up the new art.
5. Commit on the rename branch (or a follow-up into `beta`). Do not invent a replacement mark.

`scripts/render-pwa-icons.py` prefers `dist/branding/x-profile.*` when present; otherwise it re-renders the Voidwake site mark.
