# Planetary cue drop (Audio Designer)

MP3s are **not** in this PR. Drop Sonilo (or ElevenLabs alt) files here using these stems so `EngineAudio` `file:` fields resolve without a rename:

- `ambient_metal.mp3` / `ambient_mineral.mp3` / `ambient_icegiant.mp3` — ~8s loops
- `grit_metal.mp3` / `grit_icegiant.mp3` — ~1s footfall
- `pad_inspect_start.mp3` / `pad_inspect_loop.mp3` / `pad_inspect_stop.mp3`
- `embark_whoosh.mp3` — embark and takeoff

**Hold `grit_mineral.mp3`** until Audio re-rolls (classifier flagged bark). Do not add it to `sw.js` FILES until it ships.

In-game still fires `surface.inspect.*` / `surface.embark` / `surface.takeoff`; those names alias the stems above.
