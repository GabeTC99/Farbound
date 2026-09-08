# Farbound

An original solo space sandbox for Android touchscreens and desktop browsers. Inspired by the open-ended exploration, economy, mining and ship progression found in Galaxy Genome and Elite Dangerous. All names, code, interface, spacecraft, world models and game artwork here are original; no assets from those games are included.

## Play on Android

Open the hosted game in Chrome, then use **Menu → Add to Home screen → Install**. If Chrome offers a shortcut instead, it still opens the game in your browser. Open the game online once and check **Flight menu → Install on Android** for the offline-files-ready message before relying on offline access. The first hosted visit may require signing in as the Site owner.

This delivery contains a playable browser/PWA prototype and an Android application source project. **No compiled APK has been produced.** Native app installation and PWA installation have not been verified on a physical Android device.

## Frontiers 2.0

- **192 deterministic systems:** the original 24 retain their identities and coordinates. Charted space now has 64 systems, with another **128 systems in the Uncharted Reach**. Unknown catalog codes reveal their names and economy on your first visit. First discoveries award exploration data.
- **Contract navigation:** active contracts have a Plot destination route button. Nearby destinations use a direct jump; farther destinations use a route of legal jumps. Survey routes return to the issuing station after both worlds are recorded. The chart supports search, filters, pan, pinch/wheel zoom, locate-me, overview, and route fuel estimates. Jump next executes one leg at a time.
- **Planetary expeditions:** approach either world, slow below 100 m/s, and select Land. Pilot a skiff in a side view over procedural terrain. Each world has six persistent anomalies: mineral veins, relics, biosignatures, and radio echoes. Hover to scan; return to orbit and dock to sell the recorded signals. Hard impacts damage the skiff, and emergency ascent loses the current expedition’s unsold signals.
- **Four guilds:** Trading, Miners, Freelancer, and Explorers. Join any or all at station desks. Each guild offers three sequential commissions with unique module rewards. Accept commissions before doing the work; return to a desk to claim rewards. Supply commissions consume the requested cargo.
- **Three factions:** Orion Concord, Cinder Directorate, and Outer Freeholds. Relief and combat operations improve standing. Pledging lets friendly patrols assist nearby combat; attacking a faction worsens relations and can make its patrols hostile. Standing also affects local prices.
- **Physical modules and owned ships:** new ships stay in the hangar. Each hull has its own loadout, condition, and fuel. At a station, remove modules to storage, switch ships, and install them; Move here transfers a module directly from another owned ship. Slot limits and category limits make loadouts a choice. Cargo stays with the pilot and capacity checks prevent losses.
- **Engine audio:** a quiet synthesized hum follows motion and boost, pauses in menus and the background, and has a separate volume slider alongside the sound toggle.
- **Other improvements:** fuel scooping at stars enables deep exploration without stations; eight expedition relays provide services in the Reach. Depleted asteroids and defeated ships persist across reloads. Boost affects acceleration, station approach is stable, and market rounding preserves the buy/sell spread even with rewards and faction discounts.

The original trading, mining, combat, contracts, three ships, touch controls, and orbital surveys remain. Menus pause the simulation. This is a solo prototype with local progression, without multiplayer or on-foot play. Faction standing is a pilot-level simulation rather than a shared online universe.

## Controls

Touch: drag the left stick toward a direction; hold BOOST to accelerate and FIRE / MINE to shoot. Select Station, Star, Worlds, or Belt, or tap a visible object; AUTO approaches it. Dock, Scan, Scoop, or Land when within range. Open Galaxy to plot routes and jump.

In surface flight, the stick moves horizontally and vertically; release it to hover. Tap SCAN SIGNAL within range. BRAKE stabilizes the skiff. RETURN TO ORBIT ends the expedition.

Keyboard: W or Up thrust; A/D or Left/Right turn; Shift boost; S or Down brake; Space fire; N galaxy; E dock; R scan; P autopilot; L land/return to orbit; Escape menu. On a surface, A/D move sideways, W/S move vertically, and Space scans.

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
node tests/offline.mjs
```

Validation includes 9 retained classic gameplay checks, 19 Frontiers progression and migration checks, and 3 offline/static integration checks. The tests cover every system’s connectivity, fuel and routing, landing and signal sales, guild reward uniqueness, physical module transfers, faction operations, market spreads, malformed saves, and all cached assets. Browser visual QA, physical Android input/audio, and native compilation were not run in the build environment.

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
