# Farbound

An original solo space sandbox for Android touchscreens and desktop browsers. Inspired by the open-ended exploration, economy, mining and ship progression found in Galaxy Genome and Elite Dangerous. All names, code, interface, spacecraft, world models and game artwork here are original; no assets from those games are included.

## Play on Android

Open the hosted game in Chrome, then use **Menu → Add to Home screen → Install**. If Chrome offers a shortcut instead, it still opens the game in your browser. Open the game online once and check **Flight menu → Install on Android** for the offline-files-ready message before relying on offline access. The first hosted visit may require signing in as the Site owner.

This delivery contains a playable browser/PWA prototype and an Android application source project. **No compiled APK has been produced.** Native app installation and PWA installation have not been verified on a physical Android device.

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
- **Discovery scanning:** use **Discovery pulse / H** in local space. A four-second pulse catalogs the primary star and two worlds, revealing worlds in unexplored systems. It awards 150 cr of data in charted systems or 500 cr in uncharted systems, before module bonuses. Unknown-system discovery credit and Explorers Guild progress now require completing the pulse. Then approach a world and use **Scan / R** for its separate detailed survey. Slow below 100 m/s and hold fire during world surveys. Repeated taps do not restart an active scan. Dock and sell data manually at Cartographics; each catalog and world pays once.
- **Stellar arrival and scooping:** jumps arrive near the primary star, outside its scoop zone. All current ships have a built-in scoop, and all current primary stars are eligible. Approach the star, slow below 100 m/s, then deploy the scoop. Collection rate rises closer to the star, alongside heat. Heat warns at 80%, the scoop retracts at 95%, and temperatures above 100% damage the hull. Move away to cool; tanks stop filling at capacity. Heat persists across reloads.
- **Save compatibility:** old v1/v2 saves remain supported. Previously visited systems retain their catalogs and discovery rewards. Before an older v2 pilot is overwritten, its exact original JSON is retained under `farbound-save-pre-2.1`, separately from rolling checkpoints. If that backup cannot be stored, saving fails without overwriting the original pilot.

This update is prepared for review; publishing is a separate step. The preserved GitHub branch `baseline/frontiers-2.0` points to the known-good 2.0 baseline (`da5a4c5a0154b07f1855509c0dde20d4b0a982d2`). To roll back the served game, publish that baseline; to restore the exact pre-update pilot, use the preserved JSON backup. New discovery-catalog and heat state are specific to 2.1.

## Retained Frontiers features

- **192 deterministic systems:** all systems retain their identities, with coordinates now arranged around the circular core. Charted space now has 64 systems, with another **128 systems in the Uncharted Reach**. Unknown catalog codes reveal their names and economy on your first visit. Discovery pulses award exploration data.
- **Contract navigation:** active contracts have a Plot destination route button. Nearby destinations use a direct jump; farther destinations use a route of legal jumps. Survey routes return to the issuing station after both worlds are recorded. The chart supports search, filters, pan, pinch/wheel zoom, locate-me, overview, and route fuel estimates. Jump next executes one leg at a time.
- **Planetary expeditions:** approach either world, slow below 100 m/s, and select Land. Pilot a skiff in a side view over procedural terrain tinted by world kind. Each world has six persistent anomalies: mineral veins, relics, biosignatures, and radio echoes. Hover to scan; ping a beacon when you need a bearing. Return to orbit and dock to sell the recorded signals. Hard impacts damage the skiff, and emergency ascent loses the current expedition’s unsold signals.
- **Station decks:** docking drops you onto a walkable top-down deck. Visit service desks on foot; closing a desk keeps you aboard. Leave through the hangar bay.
- **Four guilds:** Trading, Miners, Freelancer, and Explorers. Join any or all at station desks. Each guild offers three sequential commissions with unique module rewards. Accept commissions before doing the work; return to a desk to claim rewards. Supply commissions consume the requested cargo.
- **Three factions:** Orion Concord, Cinder Directorate, and Outer Freeholds. Relief and combat operations improve standing. Pledging lets friendly patrols assist nearby combat; attacking a faction worsens relations and can make its patrols hostile. Standing also affects local prices.
- **Physical modules and owned ships:** new ships stay in the hangar. Each hull has its own loadout, condition, and fuel. At a station, remove modules to storage, switch ships, and install them; Move here transfers a module directly from another owned ship. Slot limits and category limits make loadouts a choice. Cargo stays with the pilot and capacity checks prevent losses.
- **Engine audio:** a quiet synthesized hum follows motion and boost, pauses in menus and the background, and has a separate volume slider alongside the sound toggle.
- **Other improvements:** fuel scooping at stars enables deep exploration without stations; eight expedition relays provide services in the Reach. Depleted asteroids and defeated ships persist across reloads. Boost affects acceleration, station approach is stable, and market rounding preserves the buy/sell spread even with rewards and faction discounts.

The original trading, mining, combat, contracts, three ships, touch controls, and orbital surveys remain. Most menus pause the simulation; station desks leave local space running, and closing them returns you to the walkable deck rather than launching. Player-facing version lives in `dist/release.mjs` (2.5.x). This is a solo prototype with local progression, without multiplayer. On-foot play covers station decks and local planetary sites after skiff touchdown. Faction standing is a pilot-level simulation rather than a shared online universe.

## Controls

Touch: drag the left stick toward a direction; hold BOOST to accelerate and FIRE / MINE to shoot. Select Station, Star, Worlds, or Belt, or tap a visible object; AUTO approaches it. Dock, Scan, Scoop, or Land when within range. Open Galaxy to plot routes and jump.

In surface flight, the stick moves horizontally and vertically; release it to hover. Soft-land for **DISBARK**, or tap SCAN SIGNAL within range / PING BEACON when airborne and out of range. BRAKE stabilizes the skiff. RETURN TO ORBIT ends the expedition (board the skiff first if you are on foot). On surface legs, walk to signal pads or the skiff pad; INTERACT inspects or boards.

On a station deck, the stick walks. Tap INTERACT at a desk to open services, or at the hangar to launch. Escape closes a desk and returns to walking; open the flight menu from the deck when no desk is open.

Keyboard: W or Up thrust; A/D or Left/Right turn; Shift boost; S or Down brake; Space fire; N galaxy; E dock / interact; R world survey; H discovery pulse; P autopilot; L land/return to orbit; Escape menu or close desk. On a surface, A/D move sideways, W/S move vertically, and Space scans, pings, or disembarks when landed. On station or planetary legs, the stick or WASD walks and Space / E interacts.

## Saves and rollback

Frontiers writes **farbound-save-v2**. On first launch it copies and migrates a valid **farbound-save-v1** pilot, preserving credits, cargo, ships, visited systems, completed objectives, and the effective strength of existing upgrades. Old upgrades become removable modules. The original v1 save is left unchanged, with an additional original-save backup retained locally.

- **Flight menu → Play original v1** opens the included original game with the original pilot. Its menu links back to Frontiers. The two releases keep separate saves; new Frontiers progress does not flow backward into v1.
- **Flight menu → Restore checkpoint** recovers a recent Frontiers pilot. A rolling checkpoint is updated approximately every three minutes. Reset, import, and checkpoint restoration first preserve the outgoing pilot. This is a short-term safety copy; export JSON for a permanent checkpoint.
- Autosave runs every four seconds, after transactions, and when leaving the game. A malformed current save falls back to a valid checkpoint or the original pilot. Surface position, discovered anomalies, fitted modules, owned ships, faction progress, depleted resources, and routes are included in saves.
- **Export save / Restore a pilot** moves progress between devices or browser/native installations. Clearing browser data removes local saves; exported files remain independent.
- A complete server-side rollback can redeploy the saved original release recorded in `releases/v1.0.0.json`. The original source revision and deployment artifact remain preserved. This changes the game served at the existing URL; it does not delete local saves.

When updating an installed game, open it online, wait for its offline files to update, then close and reopen or reload it. A complete release is cached before the new worker activates, including the original-game fallback. Check the menu’s offline readiness message before relying on offline play.

## Development

`dist/` is the authored dependency-free web game. Serve it over HTTP for local development; ES modules need a server. HTTPS is required for installation and the service worker, except localhost. No backend is needed; the production Site is privately hosted.

```sh
node --check dist/app.js
node tests/gameplay.mjs
node tests/frontiers.mjs
node tests/exploration.mjs
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
