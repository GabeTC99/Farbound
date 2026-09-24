# Planetary cues (Audio Designer)

Sonilo MP3s (ElevenLabs alts described in the pack manifest). No WAV masters.

| Stem | In-game cue | Type |
|---|---|---|
| `ambient_<kind>.mp3` | `ambient_<kind>` | loop on that kind's site |
| `grit_<kind>.mp3` | `grit_<kind>` | throttled footfall |

Kinds: earthlike, ocean, arid, ice, metal, mineral, volcanic, barren, toxic, gas, icegiant.
| `pad_inspect_start.mp3` | `surface.inspect.start` | oneshot |
| `pad_inspect_loop.mp3` | `surface.inspect.loop` | loop while surveying |
| `pad_inspect_stop.mp3` | `surface.inspect.stop` | oneshot; also stops the loop |
| `embark_whoosh.mp3` | `surface.embark` / `surface.takeoff` | oneshot |

Preferred stems (`pad_inspect_*`, `embark_whoosh`) are aliases for the `surface.*` ids the game already fires.
