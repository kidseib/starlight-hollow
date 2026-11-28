# Iteration History

A running record so future sessions do not repeat work. Newest first.

---

## Iteration 11 - The Star Tree Workshop

- The Star Tree became a second progression system and a second sparkle sink. Five star shards hide on the five adventure islands (`SHARD_BEARING` in `shardSpot(zone)` keeps each in its own corner, clear of the arch, portals and signs); the sixth shape, a Sky Lantern, is Momo's 90-sparkle gift, so exploring and shopping feed the same goal.
- Each shard is a beacon a pre-reader can find: crystal in a gold cradle on a stone plinth, ground ring, drifting motes and a column of light visible across the island, with a chime and a spoken hint at 16 m and pickup at 2.7 m. Pouch pictures appear under the sparkle counter.
- The tree carries two gold garlands with six hooks, each showing a dashed outline of its shape. Zapping the matching outline hangs a 3D ornament with a pop, a line and a sparkle burst; a wrong outline costs nothing and names the shape and its island. `canPlace`/`place`/`isComplete` are pure and tested.
- Completion changes the tree: mint-gold canopy wash, sixteen coloured glows, a warm crown star, a gold HUD badge, a Momo-then-Pip speech chain and a persistent "The Star Tree is decorated" goal. `save.shards` / `save.placed` persist; pre-iteration saves open with an empty pouch.
- Art pass: `src/world/ornaments.js` paints every shape once and reuses it for pouch, market card, tree outline and 3D ornament; market cards for magnet/bell/rainbow are now drawn too, the stall counter widened for four jars and the panel grid became 2x2.
- `tests/workshop.test.js` adds 9 cases (stock, purchase gating, single pickup, single placement, market ornament, completion, clear shard spots, save round trip). `node --test tests/*.test.js` -> 26 pass; `npm run build` -> exit 0.
- Cloud browser evidence: five beacons collected, Sky Lantern bought (97 -> 7 sparkles), six ornaments hung by zapping outlines, decorated tree + badge + character reaction reached, and everything intact after a reload. Screenshots: `artifacts/r11-{beacon-final,shard-beacon,pouch,tree-hooks2,tree-four,market-lantern,tree-final}.png`.
- Fixed during inspection: garlands clipping the octagonal trunk, ornaments floating and reading edge-on, undersized ornaments, an over-bright beacon, a patchwork decorated canopy, and a truncated pouch row. `blaster.js` now counts the frame's travel distance when testing arrival, which removes bolt tunnelling at low frame rates.
- Not verified: real audio, a Windows run, pointer-lock clicking on real hardware, or a child playtest.

## Iteration 10 - Momo's Wisp Market

- Sparkles were the one collectible with no use, so the hub gained a merchant: Momo, a lantern-snail with a striped stall at (11, 10) in Sunbeam Meadow. Zapping him opens a market that pauses the world; Esc or "All done" closes it.
- Three permanent gifts cost sparkles and change play rather than numbers: Star Magnet (40) widens the sparkle pull from 4.6 m to 9.5 m and strengthens it, Pip's Bell (70) cuts the companion nudge from 9 s to 3.5 s, Rainbow Blaster (110) steps every zap through sRGB rainbow hues.
- Cards are picture-first and stay clickable when unaffordable: the card shakes and Momo says how many more sparkles are needed. Owned gifts turn the card gold, add a badge under the sparkle counter, and swap the stall jar's icon for a star. `purchase()`/`shopStatus()` are pure and unit tested.
- `save.upgrades` stores owned gift ids; older saves load with an empty list, so the v1 key is untouched. Art pass: new Momo (body, eyestalks, glowing spiral shell, scarf), the stall with awning, jars, lanterns, hand-drawn sign and jar icons, and the Star Tree altar rebuilt with moss, a gold band and five rune lights.
- `tests/shop.test.js` adds 8 cases; `node --test tests/*.test.js` -> 17 pass. `npm run build` -> exit 0.
- Cloud browser, real render loop: crosshair went hot at the stall, a queued zap opened the market (`state === 'shop'`, purse 9, three saving cards), an unaffordable click shook the card and charged nothing, then all three gifts were bought for 40 + 70 + 110. A sparkle parked 8.09 m away drifted to 4.27 m, the next zap changed colour, and after a reload `upgrades` still held all three with magnet range 9.5 and jars marked sold. Screenshots: `artifacts/r10-market-{approach,stall,panel,owned,after-reload}.png`, `artifacts/r10-altar.png`.
- Not verified: audible narration, real pointer-lock clicking, both Windows executables, or a child playtest. Three gifts is the whole stock, so a child who buys them all has nothing left to save for.

## Windows beta release — v0.1.2-beta.1

- Shipped the gentler-second-chance build: GitHub Actions run #4 (`windows-beta.yml`, tag input `v0.1.2-beta.1`) passed on `windows-latest` and attached the ZIP to the draft release, which was then published as a public prerelease at `https://github.com/kidseib/starlight-hollow/releases/tag/v0.1.2-beta.1`.
- Note for future dispatches: the workflow only declares a `tag` input. Passing an extra `version` input makes the dispatch API reject the request, and the integration reports an empty result rather than an error, so no run appears — dispatch with `tag` alone.
- Verified signed-out: HTTP 200, 223,052,950 bytes, SHA-256 `ae6e5f7716df87a8bc55a696d9b9c8d491784c75be594872b9fc3929612e6020` (matches GitHub's asset digest), and all three entries (`Starlight-Hollow-Portable.exe`, `Starlight-Hollow-Setup.exe`, `START-HERE.txt`) pass ZIP integrity checks.
- Windows gameplay, narration, the installer shortcut, save/relaunch and uninstall still need a human Windows playtest; the build is unsigned.

## Iteration 9 — Gentler second chances

- Picture and pattern signs now shrink the question after two misses: one wrong pad dims to a quiet grey (no glow, no aim assist, no shake), `Easier now!` appears, and the existing hint is still spoken a moment later. Each further miss removes one more, never below two choices and never the answer. `sequence` and `memory` signs keep every pad, because their order is the puzzle.
- Leaving a sign at 18 m still clears only its prompt; returning restores every pad and resets the attempts counter, so a fresh approach is never pre-simplified.
- Arches carry a small star above the portal icon once that island's Starberry is safe, and their beacon fades to 0.04 opacity, so a child can read from the meadow which paths are finished.
- `tests/station-recovery.test.js` (5 cases) covers the thresholds, the answer pad, wide four-pad signs, two-choice signs and the exempt sequence/memory types. `node --test tests/save.test.js tests/station-recovery.test.js` → 9/9 pass; `npm run build` → exit 0.
- Browser runtime (cloud Chrome, software renderer): two wrong hits on `meadow-shape` left pads `['active','dim','active']` with 2 aim choices and `Easier now!`; `deactivate()` put all pads to sleep; `activate()` restored all three and reset `mistakes` to 0; no page errors. `_collectStarberry('peaks')` made the Peaks arch badge visible (world y 6.0) and dropped its beam to 0.04. Screenshots: `artifacts/r9-easier-choices.png`, `artifacts/r9-arch-star.png`.
- Not verified: audible narration, real pointer-lock zapping, the Windows executables, or a child playtest. The narrowing is a per-sign scaffold, not per-subject adaptive practice.

## Windows beta release — v0.1.1-beta.1

- Synced the current game and desktop packaging source to the public GitHub repository and added a Windows Actions workflow. The workflow reconstructs the pinned npm lockfile, runs save regression tests, builds the portable EXE and installer, checks the ZIP, and attaches it to the release.
- The first Windows runner exposed a custom NSIS path issue. Replaced that script with electron-builder's standard per-user installer; the second run passed.
- Published the prerelease at `https://github.com/kidseib/starlight-hollow/releases/tag/v0.1.1-beta.1`. An unauthenticated download returned HTTP 200; its 223,058,188-byte ZIP matched SHA-256 `f988975385f7d09151a43b5d30957dfae1ba0d0d04e3a46a7317d655d6f73dcb` and all three entries passed ZIP integrity checks.
- Windows gameplay, narration, shortcut, save/relaunch, and uninstall still need a human Windows playtest. The build is unsigned.

## Iteration 8 — Ask Pip to show it again

- Press **R** during play to hear the nearest active sign again, even if its subtitle has timed out. The repeat button uses the same action. The shortcut is inactive while paused or traveling.
- Memory signs replay the actual lights and start a fresh copy round. Answers wait until the demo finishes; repeated presses do not queue overlapping demos. Other signs keep any answer progress.
- Focused logic checks exercised nearest-sign selection, pause, speech fallback, and the memory replay cycle. The Vite production build passed. Pointer-lock input and audible playback were not tested in-browser. The existing Windows ZIP predates these changes.

## Iteration 7 — Resume an island adventure

- A return visit starts at the last island’s safe landing spot with its own Pip greeting, not back at the first arch. Pausing or leaving the page flushes pending sparkle rewards.
- Kept the v1 save key, added a previous-checkpoint backup, sanitized malformed fields, and retained dirty progress for retry after write failure. Restored the completed ending flag for five-berry saves. Meadow practice signs no longer spawn a sixth berry.
- Browser runtime: clicked Play, invoked travel to Peaks and awarded three sparkles through the game API, then immediately reloaded. Peaks, three sparkles and both visited islands were restored. This was a scripted runtime check, not child playtesting.
- Regression command: `node --test tests/save.test.js`. Next: finish the pattern interaction evidence, then make repeat-prompt accessible without releasing pointer lock. Physical Android and Windows testing remains outstanding.

## Iteration 6 — Pattern Peaks sequence plinths

- Both sequences now use animated picture rows, a pulsing mystery slot and a sequence sign. A wrong answer replays the highlight; solving or restoring a sign fills the slot. Shared station rewards and Pip reactions are retained.
- Earlier station-data audit covered all 29 stations; before image: `artifacts/r6-pattern-before.png`. The full wrong/right input capture and after image were not completed in that pass.

## Iteration 5 — A visible companion + project documentation

**Goal:** make Pip a real character in the world (he was only a voice) and start the persistent
documentation the project needs.

**Changed**

- `src/game/companion.js` (new): procedural firefly-bird — cream body, gold wings with pivots,
  oversized eyes, crest, star tail, two glow sprites. Follows the camera with damped offsets,
  trails further when running, flaps faster when moving, spins + sparks on celebration, squints and
  dips on a wrong answer, and drifts toward a sign when pointing.
- `src/game/game.js`: creates Pip, snaps him beside the player on zone entry, celebrates on
  `onStationSolved`, and adds `_updateCompanionHint()` — after 9 s of standing still with no active
  sign, Pip floats to the nearest unsolved sign, says "Over there! A sign is waiting for you."
  (voiced + hint strip), 30 s cooldown.
- `src/game/station.js`: `ctx.onWrong` hook fired from `_wrong()` and `_sequenceReset()`.
- `docs/GAME_DESIGN.md`, `docs/ITERATIONS.md` (new).

**Verified (cloud browser, software renderer, real input)**

- `npx vite build` → 0; boot clean, no console/runtime errors.
- Pip exists, is visible, and sits at 23–26 % of screen width about 2.4 m from the camera —
  beside the blaster, never over the crosshair.
- Follows while walking (5.6 m/s): keeps a steady 2.3–2.4 m, no rubber-banding, stays on screen.
- Wrong pad at the meadow sign → `companion.sad` 1.05 with "Try again!" (wings drop, eyes squint,
  body dips, plus the existing pad flash/hint).
- Correct pad → `companion.cheer` 1.30 with "Perfect!", sparkle burst, solved plinth.
- Idle 9 s with no active sign → hint strip "Pip: over there — a sign is waiting!" plus the voiced
  line, and `pointAt` targets the nearest unsolved sign (30 s cooldown so it never nags).
- Fixed during testing: Pip originally flew straight at the sign and left the frame; he now swings to
  that side of the view but stays clamped to ±0.3 rad / 2.85 m, so he is always visible while
  pointing.

**Testing note:** synthetic mouse events left large `movementX/Y` deltas in the input queue, which
made the test camera drift at the sky. Zeroing `input.dx/dy` and re-setting `player.pitch` before a
screenshot fixed the harness (the game's look code was correct).

**Known issues / next**

- Parent dashboard and adaptive difficulty are still missing.
- Pattern Peaks `peaks-ab` / `peaks-aab` still show the default "?" marker plate.

---

## Iteration 4 — Pattern Peaks memory sign plates

**Goal:** close the last non-reader gap — the two memory signs had no sign plate and fell back to a
"?" marker.

**Changed**

- `src/content.js`: `peaks-memory3` / `peaks-memory4` gained `sign: { kind: 'icon', text: '👀' }`,
  matching the memory signs in Storysong Glade and Pebblecount Cove; the second prompt was written
  as a full spoken sentence.

**Verified**

- Walked to both signs with W: plates at the standard 2.1 scale / 5.4 height, centred and readable,
  prompts voiced, four pads spaced 21 %–79% of the screen.
- Solved sign 1 with real mouse presses: wrong pad → "Start again!", flashing pad, repeated prompt;
  ⭐→🌸→🌙 → "You did it!", solved plinth, "1 of 5 signs solved".
- Reload restored the solved sign plus all five zones' stars, sockets, berries and friend.
- 5/5 ending fired with correct stats and returned to play with the HUD.

**Discovered**

- Playwright's `mouse.click()` moves the cursor first; under pointer lock that jump swings the
  camera off target, which made some click tests silently miss. Firing with `mouse.down()/up()`
  after aiming fixed the harness (game input was never at fault).

---

## Iteration 3 — Pebblecount Cove (fifth zone, mathematics)

**Changed**

- `src/content.js`: new `cove` zone (origin x 2100, sand/turquoise palette), 6 math stations,
  3 puffkins + 2 grumps, 26 sparkles, return portal, fifth meadow arch at (−40, 14).
- `src/world/textures.js`: new plate kinds `group`, `sum`, `take`; vector `+`/`−` operators; number
  pads rebuilt as big numeral + compact dot row; letter pads gained an optional picture `marker` card.
- `src/content.js`: picture markers on every grove/words letter pad (⚽ for B, 🐶 for D, …).
- Five-berry wiring: `ZONE_STAR_ORDER` + `SOCKET_COUNT` 5, altar widened, fifth HUD star, all
  totals derived from the list.
- `src/game/game.js`: cove greeting/music, zone entry cancels leftover narration, totals de-hardcoded.

**Verified**

- 6 islands, 5 arches, 5 sockets, 5 star slots, no console errors.
- Walked through the fifth arch (banner, greeting, music), solved two cove signs by real clicks with
  wrong-then-right paths, solved a grove picture-card sign by real clicks.
- Full five-berry run → ending 5/5 · 27 signs · 1 friend, "Keep exploring" → play.
- Reload restored cove 6/6 signs, its berry (not respawned), the friend, and all sockets.
- Frame rate unchanged with the sixth island (4.0 fps meadow / 3.3 fps grove in this VM).

---

## Iteration 2 — Storysong Glade (fourth zone, reading)

**Changed**

- `src/content.js`: `words` zone with 6 stations (beginning sounds, rhyme, CAT/DOG word building,
  syllables, picture memory), fourth meadow arch, `ZONE_STAR_ORDER` growth.
- Fourth HUD star slot, fourth Wish Tree socket built from a loop, `ZONE_GREETINGS.words`, `cove`
  music entry later; all "four" strings derived.
- `src/world/props.js`: sockets built in a `SOCKET_COUNT` loop.
- Performance: distance culling of islands, stations, creatures and sparkles (`setVisible`,
  `_updateVisibility`).
- Emoji pads gained a warm picture-plate backing; station prompts cancel scripted narration.

**Verified**

- Arch walk-in, two signs solved by real clicks (retry + praise), full four-berry run, ending 4/4,
  reload restore of the zone's signs, berry and befriended Song Puff.

---

## Iteration 1 — Vertical slice

**Built**

- Three.js + Vite project, first-person player (coyote time, jump buffer, soft island edge, head
  bob), canvas-glyph blaster with homing bolts, station system (pick/sequence/memory), sparkles,
  puffkins and grumbleweeds, portals with plaques and veils, Wish Tree with glowing sockets, HUD,
  speech bubble + Web Speech voice, synthesised music and SFX, localStorage save.
- Hub (Sunbeam Meadow) + Letterleaf Grove, Tallybrook Falls, Pattern Peaks; shapes/colours tutorial;
  letters, numbers, patterns and memory activities; ending sequence and "Keep exploring".

**Fixed during iteration 1**

- Stations/creatures were double-offset (island group + world position) — moved to world space.
- Terrain now flattens under stations and portals so pads are never buried.
- Ending panel scheduling moved to delta-time so it cannot stall.
