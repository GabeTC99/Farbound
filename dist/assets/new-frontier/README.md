# New Frontier art

Phase 1 of **3.0 New Frontier** paints lighting in-engine (Canvas 2D) and
composites Gabe-approved Scenario Pro plates (commercial use cleared by Risk).

## Shipped files (must stay in `dist/sw.js` FILES)

- `planet-surface-a.png` / `planet-surface-b.png` — tileable ground diffuse
- `landing-a.png` / `landing-b.png` — cinematic plates, cropped as far-field
  vistas (title / HUD chrome is not drawn over gameplay)

## Optional per-kind drop-ins

`dist/new-frontier.mjs` prefers a kind file when it has loaded, then falls
back to the shipped warm/cool pair. Prefetch lists every name below so a
PNG dropped here is picked up on the next load. Do **not** add these to
the service-worker `FILES` list until the file actually ships (`cache.addAll`
fails on 404).

Plates (far-field vista):

- `landing-earthlike.png`
- `landing-ocean.png`
- `landing-arid.png`
- `landing-ice.png`
- `landing-metal.png`
- `landing-mineral.png`
- `landing-volcanic.png`
- `landing-barren.png`
- `landing-toxic.png`
- `landing-gas.png`
- `landing-icegiant.png`

Surfaces (near-ground grain):

- `surface-earthlike.png`
- `surface-ocean.png`
- `surface-arid.png`
- `surface-ice.png`
- `surface-metal.png`
- `surface-mineral.png`
- `surface-volcanic.png`
- `surface-barren.png`
- `surface-toxic.png`
- `surface-gas.png`
- `surface-icegiant.png`

Fallbacks until a kind file arrives:

| kindId | plate | surface |
|---|---|---|
| volcanic, arid, gas, mineral | `landing-a.png` | `planet-surface-a.png` (metal surface too) |
| earthlike, ocean, ice, barren, toxic, icegiant | `landing-b.png` | `planet-surface-b.png` |
| metal | `landing-b.png` | `planet-surface-a.png` |

`dist/new-frontier.mjs` exposes `frontierAssetUrl`, `loadFrontierImage`,
`peekFrontierImage`, `prefetchFrontierArt`, `kindPlateName`, `kindSurfaceName`.
Missing files still fail silent.
