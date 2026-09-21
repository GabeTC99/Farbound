# Nullharbor — Goals Log

Created: September 8, 2026

Status: Active goals log. On September 8, Gabe authorized the engine-animation fix, fuel scooping, discovery scanning, and circular galaxy layout. Related stellar heat and primary-star arrival are included in this exploration update. Remaining goals stay planned. Implementation order and deadlines are not committed. Changes marked Ready for review are implemented and tested in the 2.1 branch, and are not yet published.

| ID | Goal | Planned scope | Status |
| --- | --- | --- | --- |
| FB-001 | Space anomalies | Add discoverable anomalies in space. Specific anomaly types and interactions remain to be designed. | Ready for review |
| FB-002 | Discovery scanning | Create exploration and discovery scanning mechanics inspired by Elite Dangerous. Initial implementation: four-second system pulse, followed by separate close-range world surveys. Touch controls and H/R shortcuts; data sells at stations. | Ready for review |
| FB-003 | Procedural planet variety | Create varied planet types with randomized variations constrained by physically plausible rules. Planet classification, composition, and appearance must remain consistent; no Earth-like gas giants. 2.14.0 paints each kind with its own albedo and adds volcanic, barren, and toxic worlds. | Complete |
| FB-024 | Planet atlas artwork | Distinct type-driven planet rendering in local space (not palette swaps), extra kinds, atmosphere limbs, and matching surface/on-foot cues. | Ready for review |
| FB-025 | Fleet and stellar atlas | Distinct class-driven ship artwork (all flyable hulls + NPC silhouettes) and spectral-aware star discs that match Planet Atlas quality. | Ready for review |
| FB-004 | Fuel scooping | Allow ships to collect fuel from stars through a fuel-scooping mechanic. Initial implementation: built-in scoops on all current ships, distance-dependent collection at all current primary stars, speed limits, and automatic retraction. | Ready for review |
| FB-005 | Stellar heat | Add heat from stars as a gameplay mechanic, including during fuel scooping. Initial implementation: distance-dependent heat, cooling away from stars, warning at 80%, scoop retraction at 95%, hull damage above 100%. | Ready for review |
| FB-006 | System arrival location | Place the player near the destination system’s primary star upon arrival in a new system. Initial implementation: arrival 950 local units above the primary star’s surface, outside scoop range, with zero velocity. | Ready for review |
| FB-007 | Multiple-star systems | Include occasional binary and trinary systems alongside single-star systems. Frequency and arrangement rules remain to be decided. | Ready for review |
| FB-008 | Initial ship roster | Create at least 20 distinct ships, each with its own textures and features. Include dedicated warships and exploration vessels with meaningful role differences. Full roster, stats, and additional roles remain to be decided. | Ready for review |
| FB-009 | Independent engine animations | Fix the reported bug where player thrust causes all ships on screen to display their engine-firing animation. Each ship’s animation should reflect that ship’s own thrust state. | Ready for review |
| FB-010 | System background variety | Give different systems different backgrounds: standard black space with stars, nebula environments, and unusual anomaly systems with effects such as space lightning. Exact distribution and whether lightning is visual or interactive remain to be decided. | Ready for review |
| FB-011 | Circular exploration frontier | Place the 64 charted systems in a roughly circular human core with 128 uncharted systems surrounding it; preserve identities and update routes for the new coordinates. | Ready for review |
| FB-012 | Station space legs | Replace utilitarian station tab dump with a top-down walkable deck. Dock enters on-foot mode; walk to service desks to open existing panels; launch only from the hangar bay. Prison barges use a detention layout. | Ready for review |
| FB-013 | Planetary space legs | After landing the skiff, disembark into shared on-foot mode to inspect surface POIs. Reuses the FB-012 hub layer. Full surface settlements and activities remain later scope. | Ready for review |
| FB-014 | Better combat | Weapon variety (Pulse / Beam / Seeker + mining laser split), loadout identity (hull and module fire modes), and combat feedback (hit confirm, threat warning, lock UI). Energy/ammo tradeoffs on capacitors and seekers. | Ready for review |
| FB-015 | Orbital mechanics | Move planets and moons along Keplerian orbits using stored orbit radius, angle, mass, and period. 2.8 stores the static fields; motion and period gameplay remain for a later update. | Ready for review |
| FB-016 | Event intervention payoffs | Ambient drama pays when the player helps: clear objectives, credits/cargo/standing rewards, and HUD objective text for active events. | Ready for review |
| FB-017 | Derelict salvage | After scanning a wreck, approach to salvage cargo/credits/modules, with optional on-foot wreck boarding for deeper finds. | Ready for review |
| FB-018 | Kind-driven surfaces | Planet kind drives surface flight feel, anomaly mixes, landmark POIs, and approach readouts that match Spectrum dossiers. | Ready for review |
| FB-019 | Company career ladders | Company ranks unlock exclusive jobs (escort, salvage, geology), Preferred hangar discounts, and a Partner liaison module. | Ready for review |
| FB-020 | Optional cloud sync | Opt-in email account sync (Supabase) so beta testers can upload/download pilots across devices. Local saves remain primary. | Ready for review |
| FB-021 | Frontier presence | First-hour Market discoverability (refuel/repair), wake-pursuit payoff, rotating market bulletins, optional asteroid prospecting, and station vocation copy. | Ready for review |
| FB-022 | Frontier instruments | Godot HUD cohesion on the web beta: screen-up radar with a heading chevron and flight-mode chip, Market/Galaxy trade-route plots, faction-colored galaxy presence, and per-station concierge names. | Ready for review |
| FB-023 | Living concourse | Remake the station interior as a 2.5D (Stardew-style) concourse: standing crew, Y-sorted furniture, speech, and a busier hub on the existing wheel hull. Planet on-foot stays overhead. | Ready for review |

## Tracking

Use the stable FB identifiers when adding detail, choosing priorities, or updating progress. Suggested progression: Planned → Ready → In progress → Verification → Complete. Ready for review means implemented and tested, awaiting review and publication.

## Change history

- September 21, 2026: Candidate 2.16.5 FPS meter in Temporary DEV tools: live `requestAnimationFrame` overlay (smoothed FPS, frame ms, 1% low) so Fold PWA testing is not stuck at Game Booster 0. Off by default; persists as `showFps` on the pilot. Near-zero cost when disabled. 2.16.2–2.16.4 flash/AA/hitch path unchanged. Service worker cache bumped to `farbound-v2.16.5`. Rollback tag `v2.16.4`.

- September 21, 2026: Candidate 2.16.4 High-mode Fold hitch (cover + inner): same stutter on the tiny outer cover and the large inner display, so the hot path was too expensive even at modest resolutions. High keeps AA/capsules/extrusion; dim stars and the galaxy band blit from caches, far orbit/scoop rings are culled, hull lighting gradients are reused. Performance LOD is optional. Bake-before-fill and transparent `#space` stay. Verify Full/High on the outer cover and again on the inner display — both must cruise without hitch; a cover hitch is not a pixel-budget problem. Service worker cache bumped to `farbound-v2.16.4`. Rollback tag `v2.16.3`.

- September 21, 2026: Candidate 2.16.3 ship/station edges: Fold clip leftover is pixel crawl on hard un-antialiased edges (Anchorage spokes, NPC hulls, player chevron). Device-aware hairline + silhouette AA on ships/player; station arms are stroked capsules; keep transparent `#space` (white-flash) and synchronized presents; snap the world camera. Service worker cache bumped to `farbound-v2.16.3`. Rollback tag `v2.16.2`.

- September 21, 2026: Candidate 2.16.2 Fold white-flash: transparent `#space` context so an uninitialized desync swap is dark CSS, not #fff; sky bake then fill; resize slack; launch/jump art warmup. Service worker cache bumped to `farbound-v2.16.2`. Rollback tag `v2.16.1`.

- September 21, 2026: Candidate 2.16.1 live-beta QA: station desk/hangar actions require walk-up range (NH-001); derelict events acquire the wreck as the nav target and SCAN no longer snaps to a world (NH-002); 800×600 HUD keeps INTERACT on-screen (NH-003); out-of-range surface SCAN SIGNAL relabels as PING BEACON (NH-004). Service worker cache bumped to `farbound-v2.16.1`. Rollback tag `v2.16.0`.

- September 21, 2026: Candidate 2.16.0 Nullharbor rename: player-facing title, welcome chip, HUD brand, PWA name, and Pages URL copy are Nullharbor. PWA install icons use Social Media Manager’s Voidwake X avatar (teal star) at `dist/branding/x-profile.png`. Save keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.0a`. Rollback tag `v2.15.7`.

- September 20, 2026: Candidate 2.15.7 smooth starfield + white-flash fix: distant stars and the Milky Way track the interpolated camera; sky wash cache is static so a desynchronized canvas no longer presents a white frame mid-cruise or on resize. Rollback tag `v2.14.0`.

- September 20, 2026: Candidate 2.15.6 Flight menu Update button: one tap unregisters the service worker, clears stale farbound caches, and reloads onto the latest Pages build. Offline play of the current build is unchanged until Update is tapped. Rollback tag `v2.14.0`.

- September 20, 2026: Candidate 2.15.5 flight pacing: fixed 60 Hz sim, time-based camera, stable star-cache sizes, and a high-DPR pixel budget so local-space flight stays continuous on phones and foldables. Atlas art unchanged. Rollback tag `v2.14.0`.

- September 20, 2026: Candidate 2.15.4 Fleet Atlas star sharpness (FB-025): photosphere cache, cellular granulation, hard limb, and a tight corona so primaries read crisp at game zoom. Ships and planets unchanged. Rollback tag `v2.14.0`.

- September 20, 2026: Candidate 2.15.3 Fleet Atlas attach pass (FB-025): engines, weapons, antennae, radiators, clamps, and dishes sit on reshaped hulls instead of floating off dart notches and wing tips. Stars unchanged from 2.15.0. Rollback tag `v2.14.0`.

- September 20, 2026: Candidate 2.15.2 Fleet Atlas craft pass (FB-025): class kits (canopy depth, recessed bells, radiators, antennae, cargo doors, hardpoints) so hulls read as distinct small spacecraft. Stars unchanged from 2.15.0. Rollback tag `v2.14.0`.

- September 20, 2026: Candidate 2.15.1 Fleet Atlas craft pass (FB-025): volume, panel lines, heat tiles, physical engine bells, and framed glass so hulls read as small spacecraft rather than class-colored icons. Stars unchanged from 2.15.0. Rollback tag `v2.14.0`.

- September 20, 2026: Candidate 2.15.0 Fleet Atlas (FB-025): class-driven ship materials and lighting for all 20 hulls plus NPC craft; spectral photospheres, corona, and limb darkening for O–M stars. Rollback tag `v2.14.0`.

- September 20, 2026: Candidate 2.14.0 Planet Atlas (FB-024): kind-driven globe albedo, volcanic/barren/toxic types, atmosphere limbs, and surface/on-foot cues. Classification still forbids Earth-like gas giants. Rollback tag `v2.13.2`.

- September 20, 2026: Candidate 2.13.2 Living Concourse polish: panelled floors, hub curb, door frames at the hub–spoke junction, hangar mouth, metal railings, directional lighting, contact shadows, and clearer prop/crew silhouettes on the same 2:1 isometric camera. Rollback tag `v2.12.1`.

- September 20, 2026: Candidate 2.13.1 Living Concourse isometric pass: station interiors use a 2:1 isometric camera with extruded hub/arm sides, depth-sorted crew and furniture, and screen-space walking. Same desks and hull collision. Rollback tag `v2.12.1`.

- September 20, 2026: Candidate 2.13.0 Living Concourse (FB-023): 2.5D station interiors with standing crew, kiosks, hangar shuttle, and floor speech. Same wheel collision and stick mapping. Rollback tag `v2.12.1`. Remaining Godot-parity lanes (not in this drop): surface pocket NPCs, post-ladder guild careers, extra commodities/refining, full 3D interiors.

- September 19, 2026: Candidate 2.12.1 pins radar contacts to local space so the dish does not spin when the ship turns. The mint chevron still shows heading.

- September 19, 2026: Candidate 2.12.0 Frontier Instruments (FB-022): radar and flight-mode chip, Market/Galaxy trade-route plots, faction-colored galaxy presence, and per-station concierge names. Remaining Godot-parity lanes (not in this drop): surface pocket NPCs, post-ladder guild careers, extra commodities/refining, full 3D interiors.

- September 18, 2026: Candidate 2.11.0 Frontier Presence (FB-021): Market briefing and Refuel desk labels, rotating traffic-board bulletins, hyperspace-wake pursuit intercepts, and optional asteroid prospecting.

- September 11, 2026: Candidate 2.10.1 Cloud Sync adds optional Supabase email OTP / magic-link pilot upload and download (FB-020). Disabled until `cloud-config.mjs` is filled; see `docs/CLOUD_SYNC.md`.

- September 11, 2026: Candidate 2.10.0 Living Frontier ships FB-015 orbital motion, FB-016 event payoffs, FB-017 derelict salvage, FB-018 kind-driven surfaces, and FB-019 company careers.

- September 10, 2026: Candidate 2.8.0 Planetary Rework completes FB-003 appearance consistency: expanded kinds, landmasses vs giant banding, moons, Spectrum Scanner dossiers, non-landable giants, and orbital groundwork fields (FB-015 later completed in 2.10.0).

- September 8, 2026: Created the initial log from Gabe’s requested goals. No game changes requested or performed as part of logging these plans.

- September 8, 2026: Implemented the authorized exploration update on `feature/exploration-2.1`. See README for implemented mechanics and remaining scope. Full planet generation, multiple-star systems, ship expansion, and space anomalies/backgrounds remain planned.

- September 8, 2026: Candidate 2.1.1 raises usable engine volume, adds job-based civilian traffic, and adds manual Cartographics sales with a persistent discovery history.

- September 8, 2026: Candidate 2.1.2 raises maximum engine output again and adds security dispatch for wanted attacks and player assaults on innocent civilian vessels.

- September 8, 2026: Candidate 2.1.3 fixes civilian weapon collisions and adds persistent crime bounties, station bounty payment, and a chance of recovered cargo after civilian destruction.

- September 8, 2026: Candidate 2.1.4 requires player participation for bounty rewards and limits security response to patrols near an active attack against the player or civilian traffic.

- September 9, 2026: Candidate 2.2.0 ships seeded system uniqueness (FB-003/FB-007): 1–3 stars, 1–5 planet kinds including non-landable gas giants, variable belts, and multi-dock stations sharing one market.

- September 9, 2026: Candidate 2.3.0 adds station space legs (FB-012): walkable top-down decks, desk hotspots for existing services, hangar-only launch. Light planetary polish: kind-driven surface visuals and beacon ping. Planetary on-foot (FB-013) remains planned.

- September 9, 2026: Candidate 2.4.0 ships planetary space legs (FB-013): skiff landing flare and readouts, disembark into a local on-foot site, inspect nearby signals on foot, board skiff to fly elsewhere, takeoff gated until boarded.

- September 9, 2026: Candidate 2.5.0 polishes system skies and ambient beds (FB-010), ships distinct space anomalies (gravity lens, radio storm, silent relic — FB-001), and richer surface sites (salvage cache + survey dwell).

- September 9, 2026: Candidate 2.6.0 ships the initial 20-hull roster (FB-008): data-driven silhouettes, per-hull slots, hangar role filters, and save loadout padding for new ship ids.

- September 9, 2026: Candidate 2.7.0 ships better combat (FB-014): Pulse / Beam / Seeker weapon modes, mining laser split from combat fire, hull/module fire-mode identity, capacitors and seeker ammo, lock brackets, hit numbers, and incoming-fire feedback.
