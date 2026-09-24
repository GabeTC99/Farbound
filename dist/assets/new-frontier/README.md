# New Frontier art

Phase 1 of **3.0 New Frontier** paints lighting in-engine (Canvas 2D) and
composites Gabe-approved Scenario Pro plates (commercial use cleared by Risk).

Shipped files:

- `planet-surface-a.png` / `planet-surface-b.png` — tileable ground diffuse
- `landing-a.png` / `landing-b.png` — cinematic plates, cropped as far-field
  vistas (title / HUD chrome is not drawn over gameplay)

`dist/new-frontier.mjs` exposes `frontierAssetUrl`, `loadFrontierImage`,
`peekFrontierImage`, `prefetchFrontierArt`. Missing files still fail silent.
Every shipped PNG must stay listed in `dist/sw.js` `FILES`.
