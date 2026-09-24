# New Frontier art hooks

Phase 1 of **3.0 New Frontier** paints lighting, planets, and landings in-engine
(Canvas 2D). This folder is the drop point for later Scenario Pro / external
PNG or sprite sheets.

`dist/new-frontier.mjs` exposes:

- `frontierAssetUrl(name)` — resolve a file in this directory
- `loadFrontierImage(name)` — optional Image load; missing files fail silent
- `peekFrontierImage(name)` — cached hit or `null`

Do **not** add placeholder PNGs here. The renderer never waits on these files.
When a real atlas lands, keep names stable (`planet-rim.png`, `skiff-overlay.png`,
`surface-dust.png`) and add only shipped files to `dist/sw.js` `FILES`.
