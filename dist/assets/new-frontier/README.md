# New Frontier art

Phase 1 of **3.0 New Frontier** paints lighting in-engine (Canvas 2D) and
composites Gabe-approved Scenario Pro plates (commercial use cleared by Risk).

`dist/new-frontier.mjs` prefers a kind file when it has loaded, then an
alias (metal/mineral → barren), then the shipped warm/cool pair.
`prefetchFrontierArt` lists every known kind name. Missing files fail silent.

## Shipped files (must stay in `dist/sw.js` FILES)

Warm/cool fallbacks:

- `planet-surface-a.png` / `planet-surface-b.png` — tileable ground diffuse
- `landing-a.png` / `landing-b.png` — cinematic plates (title / HUD cropped out)

Phase 1b per-kind plates (clean landscapes, no HUD):

- `landing-volcanic.png`
- `landing-earthlike.png`
- `landing-arid.png`
- `landing-ice.png`
- `landing-ocean.png`
- `landing-toxic.png`
- `landing-barren.png` (also covers metal / mineral until those files arrive)
- `landing-gas.png`

Phase 1b per-kind surfaces (tileable grain):

- `surface-volcanic.png`
- `surface-earthlike.png`
- `surface-arid.png`
- `surface-ice.png`
- `surface-toxic.png`
- `surface-barren.png` (also covers metal / mineral)

Ocean and gas have no dedicated surface tiles yet — they keep
`planet-surface-a/b`. Icegiant still uses the cool fallbacks.

## Still optional (do not add to SW FILES until the file ships)

- `landing-metal.png` / `landing-mineral.png` / `landing-icegiant.png`
- `surface-ocean.png` / `surface-gas.png` / `surface-metal.png` /
  `surface-mineral.png` / `surface-icegiant.png`
