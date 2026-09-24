# Nullharbor

Nullharbor — a solo space sandbox from Voidwake Studios. Explore systems, fly your fleet, make a living between the stars.

An original game for Android touchscreens and desktop browsers. Inspired by the open-ended exploration, economy, mining and ship progression found in Galaxy Genome and Elite Dangerous. All names, code, interface, spacecraft, world models and game artwork here are original; no assets from those games are included.

## Play on Android

**Fold 120 Hz:** sideload the Nullharbor APK from **https://github.com/GabeTC99/Nullharbor/releases/latest/download/Nullharbor.apk** (stable filename; steps under *Android sideload*). Chrome PWA / GitHub Pages cannot lock the display mode; native games can, and that is what the shell does. Check Releases for a newer APK.

**Windows PC:** download **https://github.com/GabeTC99/Nullharbor/releases/download/windows-v3.0.0/Nullharbor.exe** (stable filename on that tag; steps under *Windows sideload*). SmartScreen may warn on the unsigned build. Check Releases for a newer `windows-v*` exe.

**Web / PWA (Pages beta):** Open https://gabetc99.github.io/Nullharbor/ in Chrome, then use **Menu → Add to Home screen → Install**. If Chrome offers a shortcut instead, it still opens the game in your browser. Open the game online once and check **Flight menu → Install on Android** for the offline-files-ready message before relying on offline access. The first hosted visit may require signing in as the Site owner. Expect ~60 FPS while hands-off on Fold until the ship moves.

## Beta builds (share with testers)

Public beta builds are deployed from the `beta` branch to GitHub Pages:

**https://gabetc99.github.io/Nullharbor/**

To publish a new beta: merge or cherry-pick the build you want onto `beta`, push, and wait for the **Deploy beta** GitHub Action to finish. Testers only need the link above. After a new build deploys, open **Flight menu → Update** to pick up the new service worker and assets. The welcome chip should read **Nullharbor 3.0.0 · New Frontier**. Hard-refresh only if an old worker still sticks. To restore the bird’s-eye station, `git checkout v2.12.1`.

This delivery contains a playable browser/PWA prototype, a Fold-ready **Nullharbor Android sideload APK** (`com.nullharbor.game`), and a **Windows portable `.exe`**. GitHub Pages beta stays the fast web channel. APK testers download from **[Releases](https://github.com/GabeTC99/Nullharbor/releases/latest)** (`Nullharbor.apk`). Windows testers download from a `windows-v*` Release (`Nullharbor.exe`) — those tags do not replace GitHub `/releases/latest`. Play Store listing and in-app auto-update are deferred.

## Nullharbor 3.0 — New Frontier

### Candidate 3.0.0 · landing vista

- **Vertical motion:** Far cinematic plate is locked to screen space. Landing camera Y is `surfaceCameraY` (locked to `VISTA_LOCK_Y`) so mid/far `fillRidge` bands **and** the nearest play-surface hill stay put on climb. The skiff moves in screen space. Horizontal parallax on `cameraX` stays.
- **Ridge tops:** No `shadeFaces` highlight quads, contour offsets, or sun-rim stroke. Mid/far crests are the hill fill only (grain is multiplied into the same mass). Near hill keeps the white path stroke only.
- **Crop / blend:** Taller plate crop and fuller-bleed dest height, with multiply tint plus soft sponges into sky and ridge tops (no hard clipped strip).
- **Per-kind hooks:** Each `SURFACE_PALETTES` kindId maps to optional `landing-{kind}.png` / `surface-{kind}.png` under `dist/assets/new-frontier/`, falling back to shipped `landing-a/b` and `planet-surface-a/b`. Prefetch lists every known name; drop PNGs in a follow-up. Kind files are **not** in the service-worker `FILES` list until they ship.
- **Phase 1b art:** Distinct Scenario plates for volcanic, earthlike, arid, ice, ocean, toxic, barren, gas; surfaces for volcanic, earthlike, arid, ice, toxic, barren. Metal/mineral reuse barren until their own files arrive.
- **Ship:** Player-facing version stays **3.0.0**. Service worker cache is `farbound-v3.0.0-onfoot2` so Pages testers pick up the JS. Android `versionCode` stays **13**. Do **not** tag Android or Windows Releases.
- **On-foot site:** `kindId` now reaches the pad view so plates/ground match LAND. Full-bleed site ground (no clipped floor slab). Skiff uses the New Frontier lander; the walker is the standing crew sprite. Inspect pads sit on the same ground line as the skiff. Rocks stay rocks, not station blocks. LAND climb lock and solid ridge tops are unchanged.
- **Surface sun:** On-foot skiff and walker take `surfaceSun(seed)` the same way LAND lights the skiff (`sunX`).
- **Embark / takeoff:** Boarding the skiff or returning to orbit starts a short fade-in veil (`createSiteTransition`) plus `surface.embark` / `surface.takeoff` audio cue IDs. No new SFX files.
- **Kind holes:** Prefetch already lists every `landing-{kind}.png` / `surface-{kind}.png`. When metal / mineral / icegiant files appear they win over the barren/fallback alias with no code change. Do **not** add those names to `sw.js` FILES until the PNGs ship.
- **Inspect cues:** Pad survey fires `surface.inspect.start` (oneshot) + `surface.inspect.loop`, then `surface.inspect.stop` on finish or interrupt. Hooks only — Audio Designer binds assets later.
- **How to verify:** Land volcanic / ice / arid / metal. Climb and descend — hills stay screen-locked. Ridge tops should look like solid silhouettes, not a light stepped cap. Disembark — lander, walker, and pads should share one ground line. Graphics → Performance still skips the plate.

### Candidate 3.0.0 · Phase 1

- **Lighting & shading:** Local-space planets get a sharper day/night terminator, twilight band, sunward atmosphere rim, and baked relief. Performance mode still shades the disk (no more flat billboards). Orbital stations and asteroids take star-relative rim light so cruise matches the 2.5D concourse language more closely.
- **Planetary landings:** Surface flight is no longer a flat silhouette. Sun-facing ridge gradients (no per-column stripes), planet-albedo ground tint, aerial-perspective hill bands, approach haze, a volumetric skiff, and a readable ALT / SINK / SIGNALS instrument strip. On-foot pads get a layered horizon, sun disc, marked ellipse, and 2.5D rocks.
- **Graphics path:** Full / Balanced / Performance stay. Full keeps New Frontier lighting. Balanced reduces atmosphere rims and extra surface layers. Performance uses 96 px planet caches and fewer hill bands. FPS meter and the 120 Hz Android wrapper are unchanged.
- **Scenario Pro art:** `dist/assets/new-frontier/` ships Gabe-approved plates (commercial cleared by Risk). `planet-surface-a/b` tile landing / pad ground at a small screen repeat (Full 112 px, Balanced 80, Performance 56) so rock reads as grain, not wallpaper. Bake stays 384 / 256 / 192. `landing-a/b` crop as far-field vistas — title HUD is not drawn over play. Performance skips the vista.
- **Ship:** versionName **3.0.0** · Android **versionCode 13**. This is a **Pages-first** graphics ship (`dist/` is what GitHub Pages serves). versionCode is bumped so a later `android-v*` tag can replace the 2.16.x APK. Do **not** tag Android or Windows Releases until this PR merges to `beta`.
- **How to verify:** Welcome reads **NULLHARBOR / NEW FRONTIER** and **v3.0.0**. Fly a surveyed landable, land, confirm the instrument HUD and lit terrain. Graphics → Performance should stay playable. Show FPS still reports real RAF. Saves stay `farbound-save-v2`.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v3.0.0`. 2.16.2–2.16.11 flash/AA/APK/cloud sync / Windows exe paths stay.

## Nullharbor 2.16

### Candidate 2.16.11

- **Windows `.exe`:** portable Electron shell for any Windows PC (x64). Bundles the same `dist/` web game as Pages / the APK. Download **Nullharbor.exe** from a `windows-v*` GitHub Release. Unsigned — SmartScreen may warn; More info → Run anyway.
- **Network:** game files stay on-disk. HTTPS is open for optional **Cloud sync** (Supabase), same as the APK. Not an offline-only lockdown.
- **Install app:** hidden in the desktop shell (`NullharborDesktop`) and the APK (`NullharborAndroid` / `FarboundAndroid`). Pages PWA still shows the row.
- **Releases:** tag `windows-v*` / `v*-windows` runs **Windows Release** on `windows-latest` and uploads `Nullharbor.exe` plus `nullharbor-2.16.11-win.exe`. `make_latest: false` so `/releases/latest/download/Nullharbor.apk` stays the newest Android APK.
- **Ship:** versionName **2.16.11** · Android **versionCode 12** (this ship is the PC exe; no new APK). Do **not** tag a Release until this PR merges to `beta`. After merge, tag `windows-v2.16.11` on the beta tip.
- **How to verify:** run `Nullharbor.exe`, confirm the welcome chip reads **Nullharbor 2.16.11**, Flight menu has no Install app row, and Cloud sync can still reach Supabase when signed in. Pages still shows Install. Existing Node tests stay green.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.11`. 2.16.2–2.16.10 flash/AA/APK/cloud sync paths stay.

### Candidate 2.16.10

- **Hort:** Solace station messenger easter egg. Walk the concourse to the **Messenger desk** (hub, off the Cartographics arm) and talk. Horse-flavored rumors, no questline.
- **Portrait:** Station-card painting from the cleared likeness — sandy-blonde hair, light blue-green eyes, dark brows, moles, gold nose hoop, blue hoodie. Not a raw photo dump.
- **Hortreach:** Uncharted Reach system **UR-042**. Discovered name **Hortreach**; scouts also call it **Hort's Pasture**. Chart search matches Hort, Pasture, Hortreach, or UR-042. Name stays hidden until you visit.
- **Credits:** Flight menu → **Credits**. Gabriel Trindade-Coffland (Founder / Creative Director), Gillian Trindade-Coffland (Assistant Producer), Oryanna Nelson (Special Appearance · Hort). Real names stay off the galaxy chart. No emails or addresses.
- **Ship:** versionName **2.16.10** · Android **versionCode 12**. Do **not** tag a Release until this PR merges to `beta`. After merge, tag the beta tip so https://github.com/GabeTC99/Nullharbor/releases/latest updates.
- **How to find:** Dock at Solace → walk to Messenger desk (or Flight menu → Temporary DEV tools → Hort). Galaxy chart search **Hort** or **UR-042**. DEV → Teleport · Hortreach. Credits: Flight menu → Credits.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.10`. 2.16.2–2.16.9 flash/AA/APK/cloud sync paths stay.

### Candidate 2.16.9

- **APK cloud sync:** 2.16.8 sideload could not create an account (“Failed to fetch”). The shell had no `INTERNET` permission, and `shouldInterceptRequest` blocked every URL that was not `https://appassets.androidplatform.net/assets/…` — so Supabase never left the device. Pages / PWA was already fine.
- **Network:** the APK now declares `android.permission.INTERNET` only (HTTPS outbound). `usesCleartextTraffic` stays **false**. Cloud sync remains optional; RLS and the public anon key are unchanged.
- **Intercept:** only the appassets host is served from bundled assets. Other HTTPS (Supabase auth/API) returns `null` so WebView uses the real network. zip, `..`, and non-https stay blocked. Top-level navigation still cannot leave the game origin.
- **Offline:** game files stay on-device. Play, Flight menu, and 2.16.8 audio / 120 Hz shell work without a connection. Network is used only if the pilot opens Cloud sync.
- **Ship:** versionName **2.16.9** · Android **versionCode 11**. Do **not** tag a Release until this PR merges to `beta`. After merge, tag the beta tip so https://github.com/GabeTC99/Nullharbor/releases/latest updates.
- **How to verify:** APK — Flight menu → Cloud sync → create account / sign in / upload-download against the existing Supabase project. Then airplane mode: the game still loads from bundled assets. Pages — same cloud flow as before; no intercept change.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.9`.

### Candidate 2.16.8

- **Graphics copy:** Flight menu Graphics is a short player-facing summary — Full keeps the intended visuals, Balanced reduces effects, Performance is best for older phones — plus one generic line that the Android app can use a high-refresh display when the phone offers one. No Fold / Gabe / Chrome / API / Game Booster / GitHub / white-flash text in that row.
- **Install app:** hidden in the native APK (`NullharborAndroid` / `FarboundAndroid`). Pages PWA still shows the row.
- **Audio pops:** looped station/space beds fade at the wrap and drop DC; UI and fold one-shots attack from zero; Sound off uses `muteAll`; `blur` no longer hard-cuts (WebView focus storms). The APK sends `nullharbor-pause`, ramps, then pauses the WebView; resume zeros then unlocks. Loops stay single-instance.
- **Ship:** versionName **2.16.8** · Android **versionCode 10**. Do **not** tag a Release until this PR merges to `beta`. After merge, tag the beta tip so https://github.com/GabeTC99/Nullharbor/releases/latest updates.
- **How to verify:** APK Flight menu — concise Graphics, no Install app row; toggle Sound and leave/return to the app without a click. Pages — Install app still present. 2.16.2–2.16.7 flash / AA / 120 Hz shell stay.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.8`.

### Candidate 2.16.7

- **Sideload APK is the Fold 120 Hz path.** 2.16.6 compositor keep-alive + wake lock failed on Chrome PWA (still **60 until the ship moves**). Native games on the same Fold hold 120. Pages beta stays the fast web channel; PWA compositor hacks stay optional and are not expected to unlock 120.
- **Package rename:** Android applicationId / namespace is `com.nullharbor.game` (was `com.farbound.game`). JS bridge is `NullharborAndroid`, with a `FarboundAndroid` alias so existing save-export JS still works.
- **Native preferred refresh:** the WebView Activity locks `preferredDisplayModeId` + `preferredRefreshRate` to the highest mode at the current cover/inner resolution, calls `Surface.setFrameRate(..., FIXED_SOURCE, CHANGE_FRAME_RATE_ALWAYS)` on a 1 px hint surface (API 30+), sets `setPreferMinimalPostProcessing(true)`, re-applies on resume / fold / focus, and on API 35 votes `setRequestedFrameRate` + `setFrameContentVelocity` on the WebView and root. Immersive fullscreen and keep-screen-on stay. JS `refreshLock()` reports the requested Hz; the FPS meter may add `shell 120` — it does not rewrite the FPS number.
- **Build / testers:** `android/assemble-debug.sh` (or Android Studio / `./gradlew assembleDebug`) syncs `dist/` → `android/app/src/main/assets/` then builds. APK testers download from https://github.com/GabeTC99/Nullharbor/releases/latest (tag `android-v*` / `v*-android` runs **Android Release** and uploads the asset). This ship is **versionCode 9** / versionName 2.16.7, signed with the repo sideload key. Play Store / in-app updater and PC `.exe` are later. Check Releases for a newer APK.
- **How to verify on Fold:** download the APK from Releases (steps under *Android sideload*), open Flight menu → Temporary DEV tools → **Show FPS**, cruise, lift your finger for 10 s. Success: the big number stays nearer **120** (not a hard 16.6 ms hold) and the detail can show `shell 120`. Pages PWA testers should still see 2.16.2–2.16.6 flash/AA/hitch/meter behavior; expect 60 until motion on Chrome.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.7`.

### Candidate 2.16.6

- **Fold 120 Hz cruise:** Gabe’s clip (and independent review) show the DEV FPS meter at ~120 while touching — including dismissing notifications or tapping the stick — then a hard hold at **60** (16.4–16.7 ms) after ~2–3 s of hands-off cruise. Touch returns 113–120 immediately. 1% low tracks the cadence; this is not a 2.16.2–2.16.5 hitch. The loop already follows display vsync (60 Hz sim + interpolation). Chrome Android hybrid 60/120 and Samsung Adaptive / Game Optimizer drop the panel when there is no finger down. There is no web API that can set refresh rate.
- **What we can do:** during play a 1 px compositor-thread transform keep-alive runs (CSS + Web Animations) so Chrome is more likely to keep requesting 120 without touch. Screen Wake Lock keeps the panel awake. Fullscreen still hides browser chrome. 2.16.2–2.16.5 flash / AA / hitch / FPS-meter work is unchanged.
- **What we cannot do:** Game Booster, Adaptive motion smoothness, and battery savers can still lock 60. On the Fold: Settings → Display → Motion smoothness → **High / 120 Hz** if the phone has it (Adaptive will idle-throttle); Game Booster / Game Optimizer → Performance / max FPS, not 60 Hz battery saver; Chrome or this PWA → battery **Unrestricted**.
- **FPS meter:** still real RAF. If this session already saw ~120 and then sits on 60, the detail line adds `idle 60 / 120` so you can tell throttle from a 60 Hz panel. Off by default; persists as `showFps`.
- **How to verify 2.16.6:** Flight menu → Temporary DEV tools → Show FPS, close the menu, cruise, lift your finger for 10 s. If the keep-alive sticks, the readout stays nearer 120 (not a hard 16.6 ms hold). Desktop smoke cannot prove Fold VRR.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.6`.

### Candidate 2.16.5

- **FPS meter (DEV tools):** Flight menu → Temporary DEV tools → **Show FPS**. Overlays a dark/mint readout (smoothed RAF FPS, average frame ms, 1% low) while flying, on the concourse, and on the surface. Measures `requestAnimationFrame` intervals from the game loop — Samsung Game Booster reads 0 for this PWA. Off by default; persists on the pilot as `showFps`. Near-zero cost when off. 2.16.2–2.16.4 flash / AA / hitch path is unchanged.
- **How to verify 2.16.5:** Open DEV tools, toggle FPS on, close the menu, cruise (or walk the deck). The corner readout must show a non-zero FPS. Reload the save — the meter stays on. Toggle off — overlay gone.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.5`.

### Candidate 2.16.4

- **High-mode Fold hitch (cover + inner):** The same flight stutter shows on the Fold’s tiny outer cover and the large inner display, so this is not “too many pixels.” High still did 340 live star fills, a live galaxy-band gradient, a giant stroked orbit for every planet, and a new lighting gradient per craft every frame. High keeps silhouette AA, capsule spokes, extrusion, and corona; dim stars and the Milky Way now blit from caches, far rings are culled, and hull gradients are reused. Performance LOD is an extra option. Bake-before-fill and transparent synchronized `#space` stay.
- **How to verify 2.16.4:** Flight menu → Graphics → **Full / High**. On the Fold, cruise Solace on the **outer cover** and again on the **inner display** — both must stay continuous (the cover hitch means the hot path was too expensive even at modest resolution). Check: no white flash on hitch/resize; Anchorage spokes still capsules; ship silhouette AA still there. Optional: Chrome → Performance, 5 s cruise on each display; frame times near 8 ms (120 Hz) without 40–80 ms spikes while not jumping. Desktop Full/High keyboard cruise should feel the same, just steadier. Performance LOD is optional and is not the High fix.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.4`.

### Candidate 2.16.3

- **Ship/station edges:** Independent Fold clip review (Solace / Anchorage 01): leftover artifact is pixel crawl / shimmer on hard un-antialiased edges — Anchorage 01 spokes, NPC hulls, player chevron — as the camera pans. Ships and the player craft use a 2 device-pixel hairline plus a 3.2-device silhouette fringe; station arms are stroked capsules (not hard fillRect boxes). `#space` stays transparent (2.16.2 white-flash) and synchronized. The chase camera snaps to backing pixels.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.3`.

### Candidate 2.16.2

- **Fold white flash:** `#space` is a transparent canvas so a mid-cruise hitch (resize, sky-layer bake, first NPC cluster) cannot present an uninitialized paper-white frame. Sky washes bake *before* the main-buffer fill; resize ignores 1–2 px visualViewport jitter; launch / jump warms planet albedos and the sky layer.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.2`.

### Candidate 2.16.1

- **NH-001 Desk range:** OPEN CONTRACTS / LAUNCH and other concourse actions require walking to the desk or hangar (about 24 m from the pad center). The target panel still names the nearest pad from farther away so you can walk to it.
- **NH-002 Derelict target:** Forcing or rolling a derelict wreck now selects that contact, with APPROACH / SCAN / SALVAGE on the target panel. SCAN no longer retargets a planet. Scavengers wait at the wreck until you close in.
- **NH-003 800×600 HUD:** The lower control row wraps so INTERACT stays inside the viewport on short mid-width windows (foldable/phone testing).
- **NH-004 Beacon label:** On the surface, the right-hand control reads **PING BEACON** when the nearest signal is out of scan range.
- **Saves:** keys stay `farbound-save-v2`. Service worker cache bumped to `farbound-v2.16.1`.

### Candidate 2.16.0

- **Title:** the game is **Nullharbor** (Voidwake Studios unchanged). Welcome chip, HUD brand, flight menu header, PWA name, and Pages URL copy all read Nullharbor.
- **PWA icon:** install-to-home-screen uses Social Media Manager’s Voidwake X avatar (teal four-point star) at 192/512 PNG plus apple-touch-icon. Source: `dist/branding/x-profile.png`.
- **Saves:** local keys stay `farbound-save-v2` so existing pilots continue. Service worker cache bumped to `farbound-v2.16.0a`. **Flight menu → Update** still clears `farbound-*` caches.

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

The original trading, mining, combat, contracts, twenty ships, touch controls, and orbital surveys remain. Most menus pause the simulation; station desks leave local space running, and closing them returns you to the walkable deck rather than launching. Player-facing version lives in `dist/release.mjs` (3.0.0 · New Frontier). This is a solo prototype with local progression, without multiplayer. On-foot play covers station decks and local planetary sites after skiff touchdown. Faction standing is a pilot-level simulation rather than a shared online universe.

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
node tests/new-frontier.mjs
node tests/fleet.mjs
node tests/stars.mjs
node tests/flight-loop.mjs
node tests/engine-audio.mjs
node tests/cloud-sync.mjs
node tests/android-webview.mjs
node tests/desktop-webview.mjs
node tests/sw-update.mjs
node tests/offline.mjs
node tests/hort.mjs
node tests/credits.mjs
```

Validation includes 9 retained classic gameplay checks, Frontiers progression and migration checks (including station space legs), exploration regression checks, and offline/static integration checks. The tests cover every system’s connectivity, fuel and routing, landing and signal sales, guild reward uniqueness, physical module transfers, faction operations, market spreads, walkable station docks, malformed saves, and all cached assets. Browser visual QA and physical Fold sideload still need Gabe on-device. Native `assembleDebug` is scripted (Gradle wrapper + CI); a debug APK is produced when the SDK is available.

## Android sideload

APK testers download here (always the newest published Android build):

**https://github.com/GabeTC99/Nullharbor/releases/latest/download/Nullharbor.apk**

That URL stays stable. Each Android Release also keeps a versioned asset (`nullharbor-X.Y.Z-vcN.apk`) with the same bytes. Pages beta is for web testers. Releases is for APK testers. There is **no in-app auto-updater** — when you want a newer APK, open that link again. Play Store listing is later.

### First install (one-time unknown-apps)

1. Download **Nullharbor.apk** from the latest Release (or the versioned twin `nullharbor-2.16.10-vc12.apk`).
2. **One-time:** Settings → Security / Install unknown apps → allow the Files, Chrome, or Messages app you will use to open the file.
3. Open the APK → **Install**. First sideload may need **Allow from this source**.
4. Open **Nullharbor**. Game assets are offline-bundled; play works without a network. The APK may use HTTPS for optional **Cloud sync** (create account / sign in / upload-download) only.
5. Optional: Flight menu → Restore a pilot to import a Pages save (`farbound-save-v2`).

`com.nullharbor.game` is a new applicationId. Uninstall any old `com.farbound.game` build. If you installed the earlier cloud-agent debug APK (different debug key), uninstall once so this sideload-signed build can take over.

### Updates

Download the newer APK from the same Releases page and open it. Android **replaces** the installed app when:

- `versionCode` is higher than the build on the phone, and
- the APK is signed with the **same sideload key** (`android/sideload.keystore` in this repo — not the future Play Store key).

You do not uninstall first. Saves stay on device. If Android says the package conflicts or is not signed by the same certificate, uninstall once and install again.

This tree is **versionName 3.0.0 · versionCode 13**. Published `/releases/latest` stays on the last tagged APK until PM tags a newer `android-v*` (Windows `windows-v*` tags set `make_latest: false` so they do not steal that URL). Every new APK ship must bump `versionCode` (and `versionName` when the player-facing build changes) in `android/app/build.gradle`.

### Fold 120 Hz check

Flight menu → Temporary DEV tools → **Show FPS**. Close the menu, cruise in Solace, lift your finger for 10 s. Big number = real RAF. Success is nearer **120** while hands-off, with detail like `8.3 ms · 1% 118 · shell 120`. A hard **60** / `16.6 ms` / `idle 60 / 120` means the display-mode lock did not stick (Settings → Display → Motion smoothness → **High / 120 Hz**).

### Publish a new APK (maintainers)

1. Bump `versionCode` (required) and `versionName` when needed in `android/app/build.gradle`.
2. Preferred — tag and push (CI **Android Release** builds and uploads `Nullharbor.apk` plus the versioned twin):
   ```sh
   git tag android-v2.16.7
   git push origin android-v2.16.7
   # also accepted: v2.16.7-android
   # helper (prints the same commands): android/scripts/cut-android-release.sh
   ```
3. Manual fallback if Actions cannot upload:
   ```sh
   cd android
   ./assemble-release.sh
   gh release create android-v2.16.7 \
     app/build/outputs/apk/release/app-release.apk#Nullharbor.apk \
     app/build/outputs/apk/release/app-release.apk#nullharbor-2.16.7-vc9.apk \
     --title "Nullharbor Android 2.16.7 (versionCode 9)" \
     --notes "Sideload. Higher versionCode + same sideload key replaces the app."
   ```
   Or create a Release in the GitHub UI and attach both APK names.

PR **Actions → Android debug APK** is a CI smoke artifact, not the tester channel.

## Build the native Android app

`android/` ships a Gradle 8.9 wrapper. Need **JDK 17** (21 also works) and **Android SDK 35**. From a machine with the SDK:

```sh
# optional: echo "sdk.dir=/path/to/Android/Sdk" > android/local.properties
cd android
./assemble-debug.sh
# same as: ./scripts/sync-web-assets.sh && ./gradlew assembleDebug
```

Or open `android/` in Android Studio (AGP 8.7.3) and Run / Build → Assemble Debug. Gradle `preBuild` copies `dist/` → `app/src/main/assets/` (excludes `*.zip`; `sw.js` is ignored in the APK). Output:

`android/app/build/outputs/apk/debug/app-debug.apk`

The first build downloads Android build dependencies. Debug and release APKs for testers are signed with the committed **sideload** key (`android/sideload.keystore`) so a higher `versionCode` replaces the app. Play Store later uses a different unpublished key; do not reuse the sideload keystore there.

The shell serves bundled game assets through an intercepted HTTPS origin (`https://appassets.androidplatform.net/assets/`). Other HTTPS requests (optional Supabase cloud sync) pass through to the real network. The APK may use the network for that opt-in account flow; play itself stays offline. The shell keeps the screen on, goes immersive fullscreen, and exposes `NullharborAndroid` / `FarboundAndroid` (`exportSave`, `refreshLock`). Android 8.0+ and a current Android System WebView are required.

## Windows sideload

PC testers download the portable exe from a dedicated Windows tag (not GitHub `/releases/latest` — that URL is the Android APK):

**https://github.com/GabeTC99/Nullharbor/releases/download/windows-v3.0.0/Nullharbor.exe**

That filename stays stable on each `windows-v*` release. Each Windows Release also keeps a versioned twin (`nullharbor-3.0.0-win.exe`) with the same bytes. There is **no in-app auto-updater** — when you want a newer build, download a newer `windows-v*` exe. Mac/Linux launchers are later.

### First run

1. Download **Nullharbor.exe** from the `windows-v*` Release (or the versioned twin `nullharbor-3.0.0-win.exe`).
2. Windows SmartScreen may say the app is unrecognized (unsigned sideload, no paid certificate). Choose **More info → Run anyway**.
3. Open **Nullharbor**. Game assets are offline-bundled; play works without a network. The exe may use HTTPS for optional **Cloud sync** (create account / sign in / upload-download) only.
4. Optional: Flight menu → Restore a pilot to import a Pages or APK save (`farbound-save-v2`).

Saves live in the Electron userData folder on that PC. They do not migrate automatically from the browser.

### Updates

Download the newer `Nullharbor.exe` from a newer `windows-v*` tag and replace the old file. Higher display version (3.0.0 → later) is the signal that it is newer. You do not uninstall first. Saves stay on disk.

This tree is **Nullharbor 3.0.0** for the Windows portable exe. Published `/releases/latest` stays the last tagged **Android** APK. Tag the merged beta tip with `windows-v3.0.0` so the Windows assets appear.

### Publish a new exe (maintainers)

1. Bump `desktop/package.json` `version` (and `dist/release.mjs` when the player-facing build changes).
2. Preferred — tag and push (CI **Windows Release** builds on `windows-latest` and uploads `Nullharbor.exe` plus the versioned twin):
   ```sh
   git tag windows-v3.0.0
   git push origin windows-v3.0.0
   # also accepted: v3.0.0-windows
   # helper (prints the same commands): desktop/scripts/cut-windows-release.sh
   ```
3. Do **not** use a generic `v3.0.0` tag for the exe — that would mix with Android `/releases/latest`. Windows tags stay in the `windows-v*` / `v*-windows` namespace and set `make_latest: false`.

PR **Actions → Windows debug exe** is a CI smoke artifact, not the tester channel.

## Build the native Windows app

`desktop/` is an Electron portable shell. Need **Node 22** and a Windows machine (or GitHub `windows-latest`) to produce the `.exe`. From a Windows checkout:

```sh
# from repo root
bash desktop/scripts/sync-web-assets.sh
cd desktop
npm ci
npm run pack
```

Output:

`desktop/release/Nullharbor.exe`

The first pack downloads Electron. The portable exe is **unsigned** (SmartScreen will warn). Paid code signing is later. `desktop/scripts/sync-web-assets.sh` copies `dist/` → `desktop/game/` (excludes `*.zip` and `sw.js`, same idea as the APK). The shell serves bundled game assets through an intercepted HTTPS origin (`https://appassets.nullharbor.local/assets/`). Other HTTPS requests (optional Supabase cloud sync) pass through to the real network. It exposes `NullharborDesktop` (`exportSave`, `refreshLock`). Local `npm start` loads `../dist` the same way without packing.

Pages PWA remains the desktop/web channel for browsers. This exe is the offline-capable PC sideload.

## Reference research

- Galaxy Genome, developer listing: https://play.google.com/store/apps/details?id=com.skvgames.GalaxyGenome
- Elite Dangerous, official introduction: https://www.elitedangerous.com/news/getting-started-elite-dangerous
- Android documentation, local WebView content: https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
- Android frame rate / display mode: https://developer.android.com/develop/background-work/background-tasks/ui/frame-rate
- Android Gradle Plugin 8.7 documentation: https://developer.android.com/build/releases/past-releases/agp-8-7-0-release-notes

Nullharbor is an independent prototype, unaffiliated with either reference game.
