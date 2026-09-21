Social Media Manager’s Nullharbor/Voidwake **X profile** mark lives here as `x-profile.png`.

Regenerate PWA icons from the repo root:

```
python3 scripts/render-pwa-icons.py
```

That writes `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png` (plus classic copies). Bump the service worker cache in `dist/sw.js` after replacing this file.
