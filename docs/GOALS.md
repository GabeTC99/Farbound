# Farbound — Goals Log

Created: September 8, 2026

Status: Active goals log. On September 8, Gabe authorized the engine-animation fix, fuel scooping, discovery scanning, and circular galaxy layout. Related stellar heat and primary-star arrival are included in this exploration update. Remaining goals stay planned. Implementation order and deadlines are not committed. Changes marked Ready for review are implemented and tested in the 2.1 branch, and are not yet published.

| ID | Goal | Planned scope | Status |
| --- | --- | --- | --- |
| FB-001 | Space anomalies | Add discoverable anomalies in space. Specific anomaly types and interactions remain to be designed. | Planned |
| FB-002 | Discovery scanning | Create exploration and discovery scanning mechanics inspired by Elite Dangerous. Initial implementation: four-second system pulse, followed by separate close-range world surveys. Touch controls and H/R shortcuts; data sells at stations. | Ready for review |
| FB-003 | Procedural planet variety | Create varied planet types with randomized variations constrained by physically plausible rules. Planet classification, composition, and appearance must remain consistent; no Earth-like gas giants. Generation rules and planet categories remain to be designed. | Ready for review |
| FB-004 | Fuel scooping | Allow ships to collect fuel from stars through a fuel-scooping mechanic. Initial implementation: built-in scoops on all current ships, distance-dependent collection at all current primary stars, speed limits, and automatic retraction. | Ready for review |
| FB-005 | Stellar heat | Add heat from stars as a gameplay mechanic, including during fuel scooping. Initial implementation: distance-dependent heat, cooling away from stars, warning at 80%, scoop retraction at 95%, hull damage above 100%. | Ready for review |
| FB-006 | System arrival location | Place the player near the destination system’s primary star upon arrival in a new system. Initial implementation: arrival 950 local units above the primary star’s surface, outside scoop range, with zero velocity. | Ready for review |
| FB-007 | Multiple-star systems | Include occasional binary and trinary systems alongside single-star systems. Frequency and arrangement rules remain to be decided. | Ready for review |
| FB-008 | Initial ship roster | Create at least 20 distinct ships, each with its own textures and features. Include dedicated warships and exploration vessels with meaningful role differences. Full roster, stats, and additional roles remain to be decided. | Planned |
| FB-009 | Independent engine animations | Fix the reported bug where player thrust causes all ships on screen to display their engine-firing animation. Each ship’s animation should reflect that ship’s own thrust state. | Ready for review |
| FB-010 | System background variety | Give different systems different backgrounds: standard black space with stars, nebula environments, and unusual anomaly systems with effects such as space lightning. Exact distribution and whether lightning is visual or interactive remain to be decided. | Planned |
| FB-011 | Circular exploration frontier | Place the 64 charted systems in a roughly circular human core with 128 uncharted systems surrounding it; preserve identities and update routes for the new coordinates. | Ready for review |
| FB-012 | Station space legs | Replace utilitarian station tab dump with a top-down walkable deck. Dock enters on-foot mode; walk to service desks to open existing panels; launch only from the hangar bay. Prison barges use a detention layout. | Ready for review |
| FB-013 | Planetary space legs | After landing the skiff, disembark into shared on-foot mode to inspect surface POIs. Reuses the FB-012 hub layer. Full surface settlements and activities remain later scope. | Planned |

## Tracking

Use the stable FB identifiers when adding detail, choosing priorities, or updating progress. Suggested progression: Planned → Ready → In progress → Verification → Complete. Ready for review means implemented and tested, awaiting review and publication.

## Change history

- September 8, 2026: Created the initial log from Gabe’s requested goals. No game changes requested or performed as part of logging these plans.

- September 8, 2026: Implemented the authorized exploration update on `feature/exploration-2.1`. See README for implemented mechanics and remaining scope. Full planet generation, multiple-star systems, ship expansion, and space anomalies/backgrounds remain planned.

- September 8, 2026: Candidate 2.1.1 raises usable engine volume, adds job-based civilian traffic, and adds manual Cartographics sales with a persistent discovery history.

- September 8, 2026: Candidate 2.1.2 raises maximum engine output again and adds security dispatch for wanted attacks and player assaults on innocent civilian vessels.

- September 8, 2026: Candidate 2.1.3 fixes civilian weapon collisions and adds persistent crime bounties, station bounty payment, and a chance of recovered cargo after civilian destruction.

- September 8, 2026: Candidate 2.1.4 requires player participation for bounty rewards and limits security response to patrols near an active attack against the player or civilian traffic.

- September 9, 2026: Candidate 2.2.0 ships seeded system uniqueness (FB-003/FB-007): 1–3 stars, 1–5 planet kinds including non-landable gas giants, variable belts, and multi-dock stations sharing one market.

- September 9, 2026: Candidate 2.3.0 adds station space legs (FB-012): walkable top-down decks, desk hotspots for existing services, hangar-only launch. Light planetary polish: kind-driven surface visuals and beacon ping. Planetary on-foot (FB-013) remains planned.
