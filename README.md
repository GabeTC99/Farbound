# Farbound

An original solo space sandbox for Android touchscreens and desktop browsers. Inspired by the open-ended exploration, economy, mining and ship progression found in Galaxy Genome and Elite Dangerous. All names, code, interface, spacecraft, world models and game artwork here are original; no assets from those games are included.

## Play on Android

Open the hosted game in Chrome, then use **Menu → Add to Home screen → Install**. If Chrome offers a shortcut instead, it still opens the game in your browser. Open the game online once and check **Flight menu → Install on Android** for the offline-files-ready message before relying on offline access. The first hosted visit may require signing in as the Site owner.

## Beta builds (share with testers)

Public beta builds are deployed from the `beta` branch to GitHub Pages:

**https://gabetc99.github.io/Farbound/**

To publish a new beta: merge or cherry-pick the build you want onto `beta`, push, and wait for the **Deploy beta** GitHub Action to finish. Testers only need the link above. After a new build deploys, open **Flight menu → Update** to pick up the new service worker and assets. After 2.15.7 lands, the welcome chip should read **Fleet Atlas 2.15.7**. Hard-refresh only if an old worker still sticks. To restore the bird’s-eye station, `git checkout v2.12.1`.

This delivery contains a playable browser/PWA prototype and an Android application source project. **No compiled APK has been produced.** Native app installation and PWA installation have not been verified on a physical Android device.

## Frontiers 2.15 — Fleet Atlas

### Candidate 2.15.7

- **Smooth starfield:** distant stars and the Milky Way band use the same interpolated chase camera as the ship. They no longer snap to whole pixels or a 4 Hz sky-cache bucket while the hull glides.
- **White flash:** the sky wash cache no longer rebakes mid-cruise when the camera moves. That rebake, on a desynchronized opaque 2D context, could present an uninitialized white frame. Resize / leave-station now paint a dark fill immediately; `#space` has a matching CSS background.
- Flight pacing, planets, ships, and **Flight menu → Update** are unchanged from 2.15.6.

### Candidate 2.15.6

- **Update from Flight menu:** one tap unregisters the service worker, clears stale `farbound-*` caches, and reloads onto the newly deployed Pages build. A waiting worker or a newer `release.mjs` chip highlights the button as **Update available**.
- Offline play of the current build is unchanged until you tap Update. Flight, docking, and atlas art are unchanged from 2.15.5.

### Candidate 2.15.5

- **Smoother local-space flight:** physics steps at a fixed 60 Hz with display interpolation. The chase camera follows in real time, so a late frame or a 120 Hz foldable no longer makes the ship hitch on screen.
- **Fewer hot-path spikes:** star photospheres stay on the sharp 384 px Fleet Atlas cache (no zoom/DPR rebake), sky washes are cached, radar is throttled, and huge high-DPR canvases stay on a pixel budget. Planet Atlas / Fleet Atlas art is unchanged.
- **How to verify on a Fold / phone:** install the PWA, fly in Solace with FLIGHT ASSIST and the stick, then unfold / refold. Motion should stay continuous. Optional: Chrome → Performance, record 5 s of cruise; frame times should cluster near 8 ms (120 Hz) or 16 ms (60 Hz) without 40–80 ms spikes when you are not jumping systems. Desktop keyboard flight should feel the same, just steadier.

### Candidate 2.15.4

- **Sharp stars:** photospheres cache at higher resolution with cellular granulation, a hard limb, and a tight corona. A close G-class primary reads as a crisp disk, not a soft orange smear. O flares stay, just shorter. Distant starfield snaps to whole pixels.
- Same 20 player hulls plus NPC/traffic/security. Flight, docking, hitboxes, and menus unchanged.

### Candidate 2.15.3

- **Attached craft:** every player and NPC hull keeps engines, weapons, antennae, radiators, clamps, and dishes on the body. Dart notches and off-wing hardpoints are gone; planforms grew transoms, shoulders, and wing roots so fittings sit in or on the hull.
- Same 20 player hulls plus NPC/traffic/security. Flight, docking, hitboxes, and menus unchanged. Stars stay the 2.15.0 spectral pass.

### Candidate 2.15.2

- **Physical craft:** hangar cards and local-space hulls pick up class kits — framed canopies with depth, recessed engine bells, radiators, antennae, cargo-bay doors, docking clamps, and combat hardpoints — so a scout, hauler, and gunship no longer read as the same wedge.
- Same 20 player hulls plus NPC/traffic/security. Flight, docking, hitboxes, and menus unchanged. Stars stay the 2.15.0 spectral pass.

### Candidate 2.15.1

- **Grounded craft:** hangar cards and local-space hulls read as small spacecraft — gray metal, 3/4 extrusion, panel seams, heat-tile sterns, ceramic engine bells, and framed dark glass — not class-colored glowing icons.
- Same 20 player hulls plus NPC/traffic/security. Flight, docking, hitboxes, and menus unchanged. Stars stay the 2.15.0 spectral pass.

### Candidate 2.15.0

- **Ships:** every flyable hull, hangar card, and local-space NPC (security, pirate, courier, freighter, prospector, tender, surveyor) uses class metal, limb lighting, and silhouette cues instead of a flat one-tint dart.
- **Stars:** system discs are spectral — granulation, limb darkening, corona, and class-colored chromospheres for O through M. A blue giant no longer reads as a yellow blob.
- Same flight, docking, hitboxes, and menus. DEV → Fleet atlas / Stellar atlas hops for review.

## Frontiers 2.14 — Planet Atlas

### Candidate 2.14.0

- **Kind-driven globes:** local-space planets are no longer one shaded disk with a tint. Each kind has its own albedo — continents and clouds, dune belts, ice cracks, crater fields, lava, toxic decks, and banded giants with storms.
- **Atlas roster:** earth-like, ocean, arid, ice, metal-rich, mineral, volcanic, barren, toxic, gas giant, and ice giant. Orbit and star class still gate the pick (habitable-band terra around F/G/K only; inner volcanic/toxic/metal; outer ice/barren/giants). Gas and ice giants stay non-landable.
- **Atmosphere and light:** colored limb haze by kind, star-facing terminator, two-band rings. Surface flight and on-foot sites pick up matching sky/terrain cues.
- Same docking, landing flare, and survey loop. DEV → Planet atlas hops to a world of each kind.

## Frontiers 2.13 — Living Concourse

### Candidate 2.13.2

- **Polished isometric interiors:** metal floor plates, hub curb and rim light, door frames at the hub–spoke junction, corridor walls, hangar mouth, and metal railings. Directional light, contact shadows, and grounded crew/prop silhouettes.
- Same desks, hangar launch, hull collision, and screen-space walking. Planet sites stay overhead. Rollback: `git checkout v2.12.1`.

### Candidate 2.13.1

- **Isometric concourse:** the station wheel is a raised 2:1 isometric deck — hub sides, spoke corridors with volume, lighting/shadows — not a tilted floor plan. Crew, kiosks, and the shuttle share that camera. Stick/WASD follow the screen so walking still feels like the view.
- Planet sites stay overhead. Same desks, hangar launch, and hull collision. Rollback: `git checkout v2.12.1`.

### Candidate 2.13.0

- **2.5D concourse:** the station wheel is the same hull you walk, but crew stand at 3/4, furniture has height, and sprites Y-sort. Planet sites stay overhead. Stick mapping is unchanged.
- **Busy hub:** clerks at every desk, walkers on the ring, a hangar-to-market hauler, sitters on benches, a pad tech, talkers by the core, and the seeded concierge by Market.
- **Place, not schematic:** kiosks and hanging signs instead of opaque icon pads; shuttle, crates, planters, window ports, and speech on the floor. Rollback: `git checkout v2.12.1`.

## Frontiers 2.12 — Frontier Instruments

### Candidate 2.12.1

- **Stable radar:** contacts stay aligned with local space so the dish does not spin when you turn. The mint chevron still shows your nose. Lock ring and HOLD / CRUISE / COMBAT / AUTO / FOLD chip are unchanged.

### Candidate 2.12.0

Godot-shell cohesion on the GitHub Pages beta (same loops, tighter instruments):

- **Radar and flight chip:** mint chevron is your nose; gold ring marks the lock. The chip under the dish reads CRUISE / COMBAT / SCOOP / AUTO / FOLD / HEAT / HOLD. 2.12.1 pins contacts to local space so the dish does not spin.
- **Plot a sale:** Market commodities and the Galaxy **Best export** row plot a jump route to the highest legal payout on your charts. Buy stays above sell.
- **Faction presence:** visited and charted systems tint to Concord / Directorate / Freeholds. The side panel shows Friendly / Hostile / Contested / Lawless from standing and danger.
- **Station voices:** Solace keeps Nellby-9. Other docks get a seeded concierge name and faction-flavored asides.

## Frontiers 2.11 — Frontier Presence

### Candidate 2.11.0

- **Find fuel and repairs:** Market and prison Commissary desks are labeled **Refuel**. The first dock briefs you, and the first-hour tutorial points at the two buttons on the counter. Nellby-9’s first greeting sends you there.
- **Traffic board:** rotating shortages and surpluses (~20 minutes of playtime) on the Market ticker and Galaxy chart. Buy price stays above sell.
- **Wake pursuit:** scan a hyperspace wake, follow it, then jump. The contact drops in at the destination jump point — scan their hold for a payday, or intercept a fugitive.
- **Prospecting:** SCAN a rock at close range before mining for a bonus ton. Optional — unprospected rocks still mine as before.

## Frontiers 2.8 — Planetary Rework

### Candidate 2.8.0

- **Alive worlds (FB-003 / 2.14 Planet Atlas):** earth-like, ocean, arid, ice, metal-rich, mineral, volcanic, barren, toxic, gas giant, and ice giant bodies. Each kind has its own albedo, limb, and surface cues — not a tint swap. Physics-tied density, mass, gravity, temperature band, atmosphere, and composition.
- **Moons:** some planets host one or two rocky/ice/metal moons. Moons are surveyable and landable; gas and ice giants are labeled **non-landable** and refuse landing.
- **Spectrum Scanner:** after the Discovery Pulse, target a body and **SCAN** from long range to analyze it (~2.5s). The body dossier shows class, landable status, gravity, temp, atmosphere, composition, rings, and moon count. Approach and slow below 100 m/s for the detailed cartographics survey (bonus if already spectrum-scanned).
- **Orbital groundwork (FB-015):** bodies store orbit radius/angle, host star, mass, and period for a future orbital-mechanics update; local space positions stay fixed in 2.8.

## Frontiers 2.7 — combat weapons

### Candidate 2.7.0

- **Weapon variety (FB-014):** Pulse cannon, Beam lance, and Seeker rack are distinct fire modes. Mining laser is separate from combat fire — combat shots ignore rocks; targeting a rock (or an empty cone of rocks) mines.
- **Loadout identity:** Combat hulls ship with native hardpoints (Jackal/Raptor pulse, Falcon/Eagle beam, Vulture missile). Fitting a weapon module overrides the hull mode. Capacitors drain while firing; seekers restock slowly and refill on dock/launch.
- **Combat feedback:** Lock brackets on aim-assist targets, floating hit numbers, INCOMING FIRE status, and a red threat frame when you take damage.

## Frontiers 2.6 — twenty-ship roster

### Candidate 2.6.0

- **Twenty player hulls (FB-008):** explorers, scouts, traders, miners, couriers, and combat ships from the free Wren to the Eagle battlecruiser. Each hull has its own stats, slot count, silhouette, hangar preview, and reason to buy.
- **Hangar filters:** role chips (All / Explorer / Trader / Miner / Combat / Courier) plus a responsive card grid for browsing the yard.
- **Save-safe expansion:** older Frontiers pilots pad empty loadouts for new hull ids instead of failing validation.

## Frontiers 2.5 — atmosphere + exploration

### Candidate 2.5.0

- **System skies (FB-010):** clearer per-kind local-space backdrops (nebula, storm, ion, dust, deep) plus quiet sky-kind ambient beds and surface wind beds.
- **Space anomalies (FB-001):** gravity lens, radio storm, and silent relic contacts with distinct visuals, scan holds, and Cartographics `anomaly` data packages. Uncharted discovery pulses can reveal a nearby contact.
- **Richer surface sites:** on-foot inspect pads require a short survey dwell; some sites include a one-shot salvage cache.

## Frontiers 2.4 — planetary landing + space legs

### Candidate 2.4.0

- **Skiff feel:** landing flare near the ground, altitude / sink readouts, clearer craft shadow, dust plume, and hard-landing flash. Soft-land, then **DISBARK**.
- **Planetary space legs (FB-013):** after touchdown, walk a local surface site. Inspect nearby signal pads on foot to record anomalies. **BOARD SKIFF** to resume surface flight; **RETURN TO ORBIT** only after boarding. Far signals still require flying the skiff closer, landing again, and disembarking.
- Hover-scan and beacon ping remain available while airborne.

## Frontiers 2.3 — station space legs

### Candidate 2.3.0

- **Station space legs:** docking puts you on a top-down station deck. Walk corridors to Market, Cartographics, Contracts, Modules, Hangar, Guilds, and Factions. Interact at a desk to open the familiar service panel; close returns to the deck. Launch only from the hangar bay (or the Launch button inside a desk). Prison barges use a detention layout. Deck position saves while docked.
- **Light planetary polish:** surface expeditions tint sky, terrain, and skiff by world kind (ocean, arid, ice, mineral). Anomaly markers are kind-specific. Out of scan range, INTERACT / SCAN pings a beacon toward the nearest unscanned signal (short cooldown).

## Frontiers 2.1 — exploration update

### Candidate 2.1.6

- Active faction operations show the next objective in flight, Contracts, and the faction desk, with navigation to combat targets and reporting stations. NPC activity labels now come from the actual stop reached, including the inbound courier’s jump-point and station stops.

- Fly over planets, stars, and stations. Only asteroids and NPC ships physically block flight; contact stops inward motion without adding damage or crime. Stellar heat still applies.

- Bounty rewards and kill progress now require at least one successful player hit. A target destroyed entirely by system security gives no credits or combat credit.
- Security response is local to a recent attack against the player or civilian traffic. Patrols outside the incident area continue their normal route instead of acquiring wanted ships across the system.
- Civilian ships now take hits from both selected aim-assist shots and manually aimed fire. The first damaging hit applies a 400 cr bounty; destroying the vessel adds another 600 cr. Destroyed civilians have a 45% chance to yield one to three tons of recoverable cargo when hold space is available. Bounties persist in the pilot save and can be cleared at a station market.
- Maximum engine output is increased again while preserving the slider's full silent-to-maximum range.
- Security patrols now respond to active attacks. They pursue and engage wanted ships attacking the player or civilian traffic, and they turn on the player after an unprovoked attack on an innocent civilian vessel.
- Engine volume now uses the full slider range with a louder perceptual curve.
- Civilian traffic performs visible arrival, departure, mining, fuel-scooping, and planetary-survey routes instead of orbiting the station. Ships coast or stop their exhaust while working.
- Docking leaves exploration data aboard. The new **Cartographics** service lists unsold and sold system catalogs, detailed world surveys, and surface anomalies with individual values. **Sell all** completes the transaction when the pilot chooses. Destruction, emergency recovery, and failed surface expeditions remove the applicable unsold entries.


- **Engine animation fix:** each ship supplies its own thrust to the renderer. Player boost no longer lights up civilian engines; coasting does not count as thrust.
- **Circular galaxy:** 64 charted systems form a roughly circular human core centered on Solace. Another 128 uncharted systems surround it in every direction. System IDs, names, local planets, stations, and saved progress are retained; galaxy coordinates, jump costs, and routes change. Saved routes are recalculated when loaded. Overview fits the new map automatically.
- **Discovery scanning:** use **Discovery pulse / H** in local space. A four-second pulse catalogs the system and reveals worlds in unexplored systems. It awards 150 cr of data in charted systems or 500 cr in uncharted systems, before module bonuses. Then **SCAN / R** from long range for a **Spectrum analysis** (body dossier), and approach slowly for the detailed cartographics survey. Dock and sell data manually at Cartographics; each catalog and world pays once.
- **Stellar arrival and scooping:** jumps arrive near the primary star, outside its scoop zone. All current ships have a built-in scoop, and all current primary stars are eligible. Approach the star, slow below 100 m/s, then deploy the scoop. Collection rate rises closer to the star, alongside heat. Heat warns at 80%, the scoop retracts at 95%, and temperatures above 100% damage the hull. Move away to cool; tanks stop filling at capacity. Heat persists across reloads.
- **Save compatibility:** old v1/v2 saves remain supported. Previously visited systems retain their catalogs and discovery rewards. Before an older v2 pilot is overwritten, its exact original JSON is retained under `farbound-save-pre-2.1`, separately from rolling checkpoints. If that backup cannot be stored, saving fails without overwriting the original pilot.

This update is prepared for review; publishing is a separate step. The preserved GitHub branch `baseline/frontiers-2.0` points to the known-good 2.0 baseline (`da5a4c5a0154b07f1855509c0dde20d4b0a982d2`). To roll back the served game, publish that baseline; to restore the exact pre-update pilot, use the preserved JSON backup. New discovery-catalog and heat state are specific to 2.1.

## Retained Frontiers features

- **192 deterministic systems:** all systems retain their identities, with coordinates now arranged around the circular core. Charted space now has 64 systems, with another **128 systems in the Uncharted Reach**. Unknown catalog codes reveal their names and economy on your first visit. Discovery pulses award exploration data.
- **Contract navigation:** active contracts have a Plot destination route button. Nearby destinations use a direct jump; farther destinations use a route of legal jumps. Survey routes return to the issuing station after both worlds are recorded. The chart supports search, filters, pan, pinch/wheel zoom, locate-me, overview, and route fuel estimates. Jump next executes one leg at a time.
- **Planetary expeditions:** approach either world, slow below 100 m/s, and select Land. Pilot a skiff in a side view over procedural terrain tinted by world kind. Each world has six persistent anomalies: mineral veins, relics, biosignatures, and radio echoes. Hover to scan; ping a beacon when you need a bearing. Return to orbit and dock to sell the recorded signals. Hard impacts damage the skiff, and emergency ascent loses the current expedition’s unsold signals.
- **Station decks:** docking drops you onto an isometric concourse. Visit service desks on foot; closing a desk keeps you aboard. Leave through the hangar bay.
- **Four guilds:** Trading, Miners, Freelancer, and Explorers. Join any or all at station desks. Each guild offers three sequential commissions with unique module rewards. Accept commissions before doing the work; return to a desk to claim rewards. Supply commissions consume the requested cargo.
- **Three factions:** Orion Concord, Cinder Directorate, and Outer Freeholds. Relief and combat operations improve standing. Pledging lets friendly patrols assist nearby combat; attacking a faction worsens relations and can make its patrols hostile. Standing also affects local prices.
- **Physical modules and owned ships:** twenty hulls stay in the hangar when purchased. Each hull has its own loadout, condition, and fuel. At a station, remove modules to storage, switch ships, and install them; Move here transfers a module directly from another owned ship. Slot limits and category limits make loadouts a choice. Cargo stays with the pilot and capacity checks prevent losses.
- **Engine audio:** a quiet synthesized hum follows motion and boost, pauses in menus and the background, and has a separate volume slider alongside the sound toggle.
- **Other improvements:** fuel scooping at stars enables deep exploration without stations; eight expedition relays provide services in the Reach. Depleted asteroids and defeated ships persist across reloads. Boost affects acceleration, station approach is stable, and market rounding preserves the buy/sell spread even with rewards and faction discounts.

The original trading, mining, combat, contracts, twenty ships, touch controls, and orbital surveys remain. Most menus pause the simulation; station desks leave local space running, and closing them returns you to the walkable deck rather than launching. Player-facing version lives in `dist/release.mjs` (2.15.7). This is a solo prototype with local progression, without multiplayer. On-foot play covers station decks and local planetary sites after skiff touchdown. Faction standing is a pilot-level simulation rather than a shared online universe.

## Controls

Touch: drag the left stick toward a direction; hold BOOST to accelerate and FIRE / MINE to shoot. Select Station, Star, Worlds, or Belt, or tap a visible object; AUTO approaches it. Dock, Scan, Scoop, or Land when within range. Open Galaxy to plot routes and jump.

In surface flight, the stick moves horizontally and vertically; release it to hover. Soft-land for **DISBARK**, or tap SCAN SIGNAL within range / PING BEACON when airborne and out of range. BRAKE stabilizes the skiff. RETURN TO ORBIT ends the expedition (board the skiff first if you are on foot). On surface legs, walk to signal pads or the skiff pad; INTERACT inspects or boards.

On a station deck, the stick walks. Tap INTERACT at a desk to open services, or at the hangar to launch. Escape closes a desk and returns to walking; open the flight menu from the deck when no desk is open.

Keyboard: W or Up thrust; A/D or Left/Right turn; Shift boost; S or Down brake; Space fire; N galaxy; E dock / interact; R spectrum scan / world survey; H discovery pulse; P autopilot; L land/return to orbit; Escape menu or close desk. On a surface, A/D move sideways, W/S move vertically, and Space scans, pings, or disembarks when landed. On station or planetary legs, the stick or WASD walks and Space / E interacts.

## Saves and rollback

Frontiers writes **farbound-save-v2**. On first launch it copies and migrates a valid **farbound-save-v1** pilot, preserving credits, cargo, ships, visited systems, completed objectives, and the effective strength of existing upgrades. Old upgrades become removable modules. The original v1 save is left unchanged, with an additional original-save backup retained locally.

- **Flight menu → Play original v1** opens the included original game with the original pilot. Its menu links back to Frontiers. The two releases keep separate saves; new Frontiers progress does not flow backward into v1.
- **Flight menu → Restore checkpoint** recovers a recent Frontiers pilot. A rolling checkpoint is updated approximately every three minutes. Reset, import, and checkpoint restoration first preserve the outgoing pilot. This is a short-term safety copy; export JSON for a permanent checkpoint.
- Autosave runs every four seconds, after transactions, and when leaving the game. A malformed current save falls back to a valid checkpoint or the original pilot. Surface position, discovered anomalies, fitted modules, owned ships, faction progress, depleted resources, and routes are included in saves.
- **Export save / Restore a pilot** moves progress between devices or browser/native installations. Clearing browser data removes local saves; exported files remain independent.
- **Optional cloud sync:** when the build’s Supabase keys are filled in (`docs/CLOUD_SYNC.md`), Flight menu → Cloud sync can email-sign-in and upload/download the pilot. Local autosave still runs first; download confirms and keeps a checkpoint.
- A complete server-side rollback can redeploy the saved original release recorded in `releases/v1.0.0.json`. The original source revision and deployment artifact remain preserved. This changes the game served at the existing URL; it does not delete local saves.

When updating an installed game, open it online and tap **Flight menu → Update**. That unregisters the old service worker, clears stale farbound caches, and reloads so the welcome chip shows the new RELEASE. A complete release is cached before the new worker activates, including the original-game fallback. Check the menu’s offline readiness message before relying on offline play.

## Development

`dist/` is the authored dependency-free web game. Serve it over HTTP for local development; ES modules need a server. HTTPS is required for installation and the service worker, except localhost. No backend is needed; the production Site is privately hosted.

```sh
node --check dist/app.js
node tests/gameplay.mjs
node tests/frontiers.mjs
node tests/exploration.mjs
node tests/planets.mjs
node tests/fleet.mjs
node tests/stars.mjs
node tests/flight-loop.mjs
node tests/cloud-sync.mjs
node tests/sw-update.mjs
node tests/offline.mjs
```

Validation includes 9 retained classic gameplay checks, Frontiers progression and migration checks (including station space legs), exploration regression checks, and offline/static integration checks. The tests cover every system’s connectivity, fuel and routing, landing and signal sales, guild reward uniqueness, physical module transfers, faction operations, market spreads, walkable station docks, malformed saves, and all cached assets. Browser visual QA, physical Android input/audio, and native compilation were not run in the build environment.

## Build the native Android app

Open `android/` in Android Studio. Configure **JDK 17, Android SDK 35 and Gradle 8.9** for Android Gradle Plugin 8.7.3. This source distribution does not include a Gradle wrapper binary. Use an installed Gradle 8.9 distribution (Android Studio's Gradle settings can point at it), or generate a wrapper using that version:

```sh
cd android
gradle wrapper --gradle-version 8.9
./gradlew assembleDebug
```

The resulting development APK is at `android/app/build/outputs/apk/debug/app-debug.apk`. The first build downloads Android build dependencies. For distribution, create your own release signing key and signed release APK in Android Studio; no signing secrets are included.

The Android shell bundles `dist/` as offline assets, serves them through an intercepted HTTPS origin, uses no internet permission and exposes only a save-export bridge. Android 8.0+ and a current Android System WebView are required. Import uses the system document picker. The native shell is source-only and needs compile and device validation before release.

## Reference research

- Galaxy Genome, developer listing: https://play.google.com/store/apps/details?id=com.skvgames.GalaxyGenome
- Elite Dangerous, official introduction: https://www.elitedangerous.com/news/getting-started-elite-dangerous
- Android documentation, local WebView content: https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
- Android Gradle Plugin 8.7 documentation: https://developer.android.com/build/releases/past-releases/agp-8-7-0-release-notes

Farbound is an independent prototype, unaffiliated with either reference game.
