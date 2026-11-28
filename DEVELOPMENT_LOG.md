# Development log

Newest first. Each entry records what changed, how it was checked, and what is still open. The
long-form narrative is in `docs/ITERATIONS.md`; player-facing notes are in `CHANGELOG.md`.

---

## Iteration 20 — Curious things that answer back (2026-11-28)

**Chosen because** the roadmap's top item was "signs that use the gadgets": every tool in the hollow
pointed at a floating sign, and the worlds themselves never reacted. A child could walk past a whole
island and nothing but sparkles noticed.

**Changed**

- `src/game/curios.js` (new, pure) — the rules and copy for twelve "curious things": `CURIO_TYPES`
  (leaf, crystal, stone), `CURIO_SPARKLES`, `CURIO_LINES`/`CURIO_AGAIN`, four true `STONE_FACTS`,
  `curioReward(type, seen)` (pays once, never twice) and `curioScanReady(type, distance, angle)`.
- `src/world/curios.js` (new) — `CurioField` builds and animates the three kinds from content data:
  a **leaf drift** (nine faceted clumps, twenty-eight blades, curled rim leaves, a twig and a shy
  mushroom), a **sun crystal** (four faceted shards on a dodecahedron slate slab with slate chips, a
  moss cluster and gold flecks) and a **listening stone** (a leaning six-sided menhir with a slanted
  head, two weathering plates, a crack, moss at the foot, a pebble ring and a carved gold rune).
  Zapping scatters a drift or rings a crystal (14-particle burst + 6 motes, no camera motion); both
  gather themselves back (22 s / 18 s). A stone opens to the existing scanning gaze after 0.7 s within
  4.6 m, lights its rune and stays lit for the session.
- `src/content.js` — two curios per island (`curios` data): meadow leaf + stone, grove leaf + crystal,
  falls leaf + stone, peaks crystal + stone, words leaf + crystal, cove crystal + stone. They are also
  added to the scatter blockers so no tree grows through one.
- `src/game/game.js` — aim picks a curio only when no sign, creature, hook or Momo is in front of it;
  `_fire` sends a bolt at it and `onBoltHit` routes `type: 'curio'` to `_hitCurio`, which plays
  `audio.rustle()`/`audio.crystal()`, pays the first-time sparkles and speaks Pip's line. `_updateScan`
  now also charges a `stoneTimer` for a close listening stone and `_listenStone` speaks the fact, with
  `audio.scan()` and `chime(3)`. Everything is a normal bolt and the normal gaze — no new buttons.
- `src/engine/audio.js` — `rustle()` (two filtered noise layers plus a settling tone) and `crystal()`
  (three glassy triangle strikes with echo and a shimmer).
- `tests/curios.test.js` (new) — three cases: every island has at least two curios clear of signs,
  arches, the landing spot and each other; ids are unique and every stone has a short statement (never
  a question); rewards pay once and only a close, centred look opens a stone.

**Verified** (1280×720 page in the same authenticated context; the preview panel is portrait)

- Aim reports `meadow-leaf` when looked at; a bolt plays `rustle` → `collect` → toast "Leaves
  everywhere!" → Pip's line and pays 3 sparkles (20 → 23). A second zap of the regrown drift pays 0.
- Running the regrow timer down put the drift back (`ready: true`, scatter easing 1 → 0.85) with no
  loss and no repeat reward.
- Crystal: bolt plays `crystal` → `collect` → "Crystal song!" → Pip's line and pays its 4 first-time
  sparkles; the cluster shrinks to a stub and its timer runs 18 s before it grows back.
- Listening stone: the gaze lit the rune, played `scan` and `chime(3)` and spoke "A snail carries its
  little house on its back."; the first listen paid 3 sparkles, a repeat paid 0 but still spoke.
- Kept guarantees: a 13/13 save still opens the grotto (13 lanterns, `grottoOpen: true`), a 12/13 save
  keeps it shut, and a pre-iteration save (`{zone, sparkles:15, stars, visited}`) boots at 15 sparkles,
  `0/13`, with all six islands' curios built — and zero console or page errors on every load.
- Inputs while a curio was in view: keyboard walk 0.39 m / jump 0.32 m / zap, mouse look −0.25 rad /
  click zap, emulated touch stick walk 0.15 m / zap button, injected gamepad stick 0.09 m / X zap /
  Start pause → resume. Nothing was blocked.
- `node --test tests/*.test.js` → 66 pass; `npm run build` exit 0.

**Fixed while inspecting** (each caught at gameplay size, not from code)

- The first leaf drift read as a lumpy potato: rebuilt from nine faceted clumps with a fan of blade
  leaves and curled rim leaves.
- The crystal's moss was a flat green cookie and its plinth a smooth bun: now a faceted slate slab with
  chips, a moss cluster and gold flecks; the white glow was cut from 1.35/0.2 to 0.9/0.12.
- The stone was a smooth bollard with a moss lid and a dark hoop: now a leaning menhir with weathering,
  moss at the foot, and a single carved face. The back rune was removed after the screenshot showed its
  ring peeking around both sides as pale "wings".
- Scatter bursts were blowing out to white: 20 × 0.4 → 14 × 0.24 with the amber/blue tints.

**Open**

- The roadmap's word was "vacuum-able" leaf pile. The hollow has two verbs (a bolt and a patient gaze),
  so the drift answers the bolt instead; a real vacuum tool would need a tool switch on all four
  devices and is recorded as its own roadmap item rather than half-built here.
- Curios are session state only (no save key): they regrow in place and never gate anything.
- Still unverified on an Android phone, a physical controller or a Windows build. GitHub push remains
  blocked on a user credential.

---

## Iteration 19 — The meadow answers when it grows (2026-11-28)

**Chosen because** iteration 18 gave the hub thirteen staged details, but a child who found a keepsake
heard the same star chime as any pickup and read a keepsake-flavoured line. Nothing told them the
*place* had changed, and the change itself could be on another island.

**Changed**

- `src/game/hubBloom.js` — new pure `growthChange(before, after)` compares two `hubBloom()` results and
  returns the named change: `kinds` (grotto, lantern, pennant, paver, rim, stone, firefly, flag, bloom
  with amounts), `flags`/`blooms` added, `stageIndex`, `stageChanged`, and a spoken `line`. Because both
  sides are the same data the world renders from, the words cannot disagree with the geometry. Also
  added `growthStageIndex(found)` and `WORLD_NAMES`.
- The line names one or two things that actually grew ("The planter for Tallybrook Falls is in full
  bloom! A moonwell stone woke up!"), stays to two sentences, and only when a *new stage* begins adds
  the gentle pointer "The far lanterns are still sleeping." — never a countdown, never a threat.
- `src/world/growth.js` — `HubGrowth.bloom` is now kept on the instance, and `flourish(change)` places
  a warm mote of light on each new thing plus one soft scale swell (`SWELL` 0.03–0.35 per kind, with
  `LIFT` so the mote sits on the art, not its origin), returning the world targets. `flourishAt(point)`
  does the same for the chest. Neither touches the camera or input.
- `src/engine/audio.js` — `grow(stage)` is its own motif: a four-note rise in the key of the stage with
  a low triangle pad and a soft shimmer. Deliberately unlike `collect()` (two blips) and `star()` (the
  five-note keepsake sparkle), so a child can hear "the meadow changed" as a different event.
- `src/game/game.js` — `_findSecret` snapshots `hubGrowth.bloom` before refreshing and calls
  `_celebrateGrowth(before)`: flourish + `audio.grow(stageIndex)` immediately, then (1.9 s later, so it
  does not cut off the keepsake's own line) Pip's hub line in the bubble and voice. `_collectGrotto`
  adds the same flourish and chime at the chest. At 13/13 the grotto has its own announcement, so the
  hub line is suppressed there instead of speaking twice. Resumed saves never call the celebrate path,
  so a load or reload is silent.
- `src/engine/motion.js` (new) — `reducedMotion()` follows the OS `prefers-reduced-motion` setting by
  default and remembers an explicit choice in `starlight-hollow-calm-motion`; `setReducedMotion()`.
  The pause screen gained a `Calm motion: on/off` button beside Sound. When it is on, the flourish is a
  pure light mote — no scale swell, no burst, no shake.
- `index.html`, `src/main.js` — the pause-screen toggle and its label.
- `tests/hubBloom.test.js` — two new cases: the announcement names real growth (and returns null for the
  same count, a lower count or a missing before), each threshold names the stage that appeared, the
  pre-thirteen line points at what is asleep while 13/13 does not, and a hostile save cannot announce
  anything.

**Verified** (1280×720 page in the same authenticated context; the preview panel is portrait)

- Threshold 3→4: `growthChange` = lantern+pennant+flag, `audio.grow(2)` fired once (330/415/494/659 Hz
  + 165 Hz pad + shimmer) after the ordinary `star()` sparkle, three glows and three swells on the new
  lamp, pennant and flag; Pip said "The Sunbeam Meadow flag is flying! The far lanterns are still
  sleeping." Screenshot `artifacts/iter19-flourish-low.png`.
- Threshold 6→7: lantern+pennant+paver+rim+flag, `grow(3)` (349/440/523/698 Hz + 175 Hz), the Pip line
  arrived 1.9 s later as designed. Screenshot `artifacts/iter19-flourish-mid.png`.
- Threshold 9→10: lantern+pennant+rim+stone+firefly+flag, `grow(4)`, new flagstone row and motes at the
  grotto approach. Screenshot `artifacts/iter19-flourish-high.png`.
- 12→13: `kinds` starts with `grotto`, `grow(5)`, veil 1 → 0, `grottoOpen: true`, and the grotto's own
  line spoken once. Screenshot `artifacts/iter19-flourish-13.png`.
- No spurious flourish: a resumed 7/13 save produced zero `grow` calls, zero pulses and zero glows on
  load and again after a reload (7 lanterns already standing); a duplicate `_findSecret` on a found spot
  returned false with no flourish; an ordinary sparkle pickup (20 → 21) produced no flourish.
- Reduced motion on: pulses 0, glow mote present, burst count 6 — nothing swells or shakes.
- Inputs while a flourish was on screen: keyboard walk 0.16 m + jump 0.32 m + zap; mouse look −0.336 rad
  + click zap; emulated touch stick `y −1` walk 0.16 m + jump + zap; injected gamepad stick `x 1` walk
  0.39 m + jump + zap + Start pause → resume. Nothing was blocked.
- The grotto chest: `grow(5)`, one glow and one swell at the chest, banner "Moonwell Treasure", 30
  sparkles (30 → 60), lid open.
- Legacy save (`{zone, sparkles:15, stars, visited}`): boots at 15 sparkles, `0/13`, no growth, no
  console or page errors.
- `node --test tests/*.test.js` → 63 pass; `npm run build` exit 0.

**Open**

- The chime is synthesised, not recorded; whether it carries on a phone speaker is untested.
- The flourish was proved with emulated touch and an injected pad — no Android phone, controller or
  Windows build was run. GitHub push remains blocked on a user credential.

---

## Iteration 18 — The hub grows all the way, not just at the end (2026-11-28)

**Chosen because** iteration 17 made the grotto beautiful, but the meadow went from "nothing" to
"everything" with only two or three visible steps between: thirteen lanterns, three flags and three
blooms carried the whole journey. Halfway felt like a slightly longer list, not a place changing.

**Changed**

- `src/game/hubBloom.js` — the rules now return staged counts, still from `sanitizeSecrets` only:
  `pavers` (path flagstones, laid two keepsakes at a time, seven in all), `pennants` (one bunting
  pennant per keepsake), `fills` (per-island planter fill, 0–1), `stones` (stepping stones, one per
  keepsake past eight), `rim` (moonwell rim stones waking from the fifth), `fireflies` (arch
  fireflies over the last four), `veil` (0–1, how thin the sleeping veil has become) and a named
  `step`. Lanterns, flags, blooms, `grottoOpen` and `grottoWhisper` are unchanged.
- `src/world/growth.js` — new `_buildPavers()` (hexagonal flagstones with a darker lip and moss
  tufts, not discs) and `_buildPennants()` (two posts, a sagging rope and thirteen small triangular
  pennants in island colours). Each planter's five stems are now separate groups, so a bed fills one
  keepsake at a time and only glows when its island is complete. The moonwell's nine rim stones and
  the five stepping stones come in one at a time, four fireflies drift to the arch, and the veil
  thins and brightens as the last keepsakes arrive — it still only parts at thirteen.
- Lanterns rebuilt: a dark wooden frame (sill, lintel, four corner bars, a roof and a gold finial)
  around warm glass, hung from an arm with a hook. They now read as lamps instead of pale cubes, and
  lit versus unlit is obvious in daylight.
- `src/world/discoveries.js` — the keepsake row evened again: the pebble's display scale came down
  from 1.55 to 1.25 (it had begun to out-read the egg), the kite got a wooden stand and a longer
  string so it is displayed rather than floating, the drum got an inset cream head with a dark rim,
  and the shell lies flatter and wider.
- `tests/hubBloom.test.js` — three new cases: the staged counts never go backwards across 0→13 and
  land on their caps, planters fill partially and only complete with their island, and a hostile save
  (duplicates, junk, non-lists) cannot over-grow any stage.

**Verified** (1280×720 page in the same authenticated context; the preview panel is portrait)

| Save | Lanterns | Flags | Pennants | Pavers | Planter stems | Stones | Rim | Fireflies | Veil |
|---|---|---|---|---|---|---|---|---|---|
| fresh | 0 | 0 | 0 | 0 | 0·0·0·0·0·0 | 0 | 0 | 0 | up |
| 4/13 | 4 | 2 | 4 | 2 | 5·3·0·0·0·0 | 0 | 0 | 0 | up |
| 7/13 | 7 | 3 | 7 | 4 | 5·5·5·0·0·0 | 0 | 3 | 0 | up |
| 10/13 | 10 | 5 | 10 | 5 | 5·5·5·5·3·0 | 2 | 6 | 1 | up |
| 13/13 | 13 | 6 | 13 | 7 | 5·5·5·5·5·5 | 5 | 9 | 4 | parted |

- At 7/13 walking at the arch still stopped the child 5.21 m out with Pip's "Something is sleeping
  here. 6 keepsakes would wake it."; the grotto stayed shut at 10/13 with two stones and a thin veil.
- At 13/13 the chest collected 40 → 70 sparkles with the "30 sparkles!" banner, `save.grotto: true`,
  and a reload kept 70 sparkles, 13 lanterns, 13 pennants, 7 pavers, 5 stones, 9 rim stones, the open
  lid and the taken chest.
- A pre-iteration save (`{zone, sparkles: 15, stars, visited}`) booted at 15 sparkles, `0/13`, nothing
  grown, veil up, with an empty page-error and console-error collector.
- Inputs: keyboard 4.64 m walk / 1.04 rad turn / jump / zap / pause↔play; mouse 1.34 rad yaw and
  0.94 rad pitch under real pointer lock plus click-zap; emulated touch walk 0.92 m, look −0.21 rad,
  zap, jump, pad visible; injected gamepad walk 3.92 m, look −0.62 rad, zap, jump, play↔paused. Each
  legend matched its device.
- `node --test tests/*.test.js` → 61 pass, 0 fail. `npm run build` → exit 0.
- Screenshots: `artifacts/r18-fresh.png`, `r18-low.png`, `r18-mid.png`, `r18-high.png`,
  `r18-thirteen.png` (path), `r18-garden-4/10/13.png` (planters), `r18-grotto-10/13.png`,
  `r18-grotto-chest.png`, `r18-bench.png`, `r18-lamp-lit.png`.

**Fixes during the iteration**

- The first flagstones rendered as pale discs with a hole in the middle; rebuilt as hexagonal slabs
  with a darker base lip and moss tufts at the edge.
- The lanterns read as cream cubes; rebuilt with a frame, glass and a hanging hook.
- State-by-state capture kept restoring the previous save: `pagehide` flushes progress over the top of
  a hand-written save, so the harness now stubs `flushProgress`/`_save` before writing. Worth knowing
  for any future save-state testing.

**Open**

- Real Android hardware, a physical controller and a Windows build are still untested.
- The grotto veil is a glow and a translucent sheet; it reads as "asleep" but not as fabric.
- GitHub push remains blocked on a user credential; iteration 18 exists only in the local checkpoint.

**Next**

1. Signs that use the gadgets (vacuum-able leaf pile, blast-able crystal) so the tools have scenery.
2. A keepsake hidden behind a small environmental puzzle instead of a walk-in.
3. Mid-collection music and Pip lines that name the new stage, so the growth is heard as well as seen.

---

## Iteration 17 — The grotto gets its stone, and the hub is inspected at 16:9 (2026-11-28)

**Chosen because** iteration 16 proved the growth *worked* but skipped the look: its own open list
said the grotto pillars were plain cylinders, and every screenshot had been taken in a portrait
preview, so nothing had been judged at the size a child actually plays at.

**Changed**

- `src/world/growth.js` — the arch is carved, not extruded. Each column now has a plinth and lip, a
  tapered eight-sided shaft, three carved bands and a capital with a gold trim; a diamond keystone
  with a pale inset and a star motif sits in the lintel; a bracket lantern with a glow and a little
  roof hangs on each column; ivy is tucked round the capitals instead of the bead-like vines that
  read badly up close; a mossy threshold with seams sits under the arch.
- The grotto is enclosed and dressed: a six-boulder rock outcrop closes the back so it reads as a
  place rather than an arch in a field; the moonwell gained a rim ring, three lily pads and nine rim
  stones; three fern clusters, three mushrooms, moss patches and a stone bench fill the inside; the
  chest now stands on a cut stone footing.
- `_buildTreeline()` (new): eight low-poly trees, nine shrubs and a worn approach of pebbles and
  grass tufts around the clearing, and the hub scatter blocker around the grotto grew from 7.5 m to
  10 m so no tree can grow through the arch.
- Sweep at gameplay size: lantern glow sprites shrank from 1.5 to 0.95 and their pulsing opacity
  from 0.42 to 0.26 (they were blowing out to white blobs); the flower beds became raised wooden
  planters with five dainty four-petal stems each instead of one fat bloom on a bowl; meadow flowers
  got thinner stems and smaller petals so they stop reading as mushrooms.
- `src/world/discoveries.js` — keepsake reads fixed without touching the row layout: the book is open
  on its spine with page blocks and text lines, the pebble is thicker with two chips beside it, the
  kite sits lower and is tied to its dish with a brown string, the shell is a flatter fan facing the
  child, and the drum is terracotta instead of pale cream.

**Verified** (cloud browser, 1280×720 page, real render loop where needed)

- Fresh save (both save keys cleared): `0/13`, 0 sparkles, 0 lanterns, 0 flags, 0 blooms, veil up,
  chest hidden.
- 7/13: `7/13`, 7 lanterns, 3 flags, 3 blooms, veil up, chest hidden; walking at the arch stopped the
  child at 5.21 m with Pip's bubble reading "Something is sleeping here. 6 keepsakes would wake it."
- 13/13: `13/13`, 13 lanterns, 6 flags, 6 blooms, veil gone, stepping stones and chest visible;
  walking to the chest took sparkles 41 → 71 with the "Moonwell Treasure / 30 sparkles!" banner and
  `save.grotto: true`; a reload kept 70 sparkles, the open lid and all 13 lanterns.
- Pre-iteration save (`{zone, sparkles: 15, stars, visited}` only): boots at 15 sparkles, `0/13`,
  nothing grown, veil up, and the page error collector stayed empty.
- Inputs after the changes: keyboard walked 3.92 m, turned 0.8 rad, zapped twice, jumped, paused and
  resumed (legend "WASD move · mouse look · E zap"); mouse turned 3.05 rad under real pointer lock and
  zapped by click (legend "… click zap"); emulated touch walked 0.69 m, looked −0.32 rad, zapped,
  jumped with the pad visible (legend "Thumb pad to walk · drag to look · zap button"); an injected
  gamepad walked 3.92 m, looked −0.58 rad, zapped, jumped and toggled play↔paused (legend "Left stick
  walk · right stick look · RT zap").
- Screenshots at 1280×720: `artifacts/r17-fresh.png`, `r17-seven.png`, `r17-thirteen.png`,
  `r17-grotto-shut.png`, `r17-grotto-open.png`, `r17-bench-final.png`.
- `node --test tests/*.test.js` → 58 pass, 0 fail. `npm run build` → exit 0.

**Fixed during the iteration**

- A runtime `ReferenceError` (`moss`, then `stoneDark`, used outside `_buildGrotto`) made the game
  fail to boot after the treeline pass — the production build compiles, so only loading the page
  caught it. The treeline now owns its own materials. Lesson recorded: check `window.__starlight`
  exists after a world change, not just that the build exits 0.
- Fresh-save testing kept restoring 7/13 until both `starlight-hollow-save-v1` **and** its
  `-backup` key were cleared: the backup fallback in `loadSave()` is working as designed.

**Open**

- Real Android hardware, a physical controller and a Windows build are still untested; touch and
  gamepad were emulated/injected again.
- GitHub push remains blocked on a user credential; iteration 17 exists only in the local checkpoint.
- The pattern-sign wrong/right capture and a human Windows playtest are still outstanding.

**Next**

1. A mid-collection growth step (the path widening or a bridge appearing at 7/13) so halfway feels
   different, not just more lit.
2. Signs that use the gadgets — a vacuum-able leaf pile, a blast-able crystal — so the tools have
   scenery to point at.
3. Keepsakes hidden behind a small environmental puzzle instead of a walk-in.

---

## Iteration 16 — The hub grows, and a grotto wakes (2026-11-28)

**Chosen because** thirteen keepsakes only ever added a trophy to a bench: collecting changed a
number, not the place. Nothing a child could point at said "I did this".

**Changed**

- `src/game/hubBloom.js` (new, pure): `hubBloom(found)` turns a saved list into lanterns lit, island
  flags, bloomed beds, completion and grotto state; `grottoLoot()` says whether the chest can be
  taken; `grottoWhisper()` names how many keepsakes are still missing. Every input goes through
  `sanitizeSecrets`, so junk cannot reach the world.
- `src/world/growth.js` (new): `HubGrowth` builds 13 lantern posts along the walk-up path, six island
  bunting flags by the market, six flower beds by the bench, and the grotto behind the Star Tree —
  a stone arch, a shimmering veil, stepping stones, a moonwell with rim stones, two crystals,
  fireflies and a banded chest. `refresh(found, taken)` drives all of it from the save.
- `src/game/game.js`: builds the growth with the hub, refreshes it on every find and on load, nudges a
  child back from the sleeping grotto with a spoken hint ("6 keepsakes would wake it"), wakes the
  grotto at 13/13, and collects the chest on proximity — 30 sparkles, banner, Pip line, particles,
  saved as `save.grotto`. The 13th find's hint now points at the grotto.
- `src/world/discoveries.js`: `trophyDisplayScale()` evens the bench row — the pebble draws at 1.55×,
  the shell 1.45×, the jar 1.3×, the egg and drum at 1.0× — without changing the single-row layout.
- `src/engine/save.js`: `grotto: s.grotto === true` in the decoder, so only a literal `true` opens the
  chest after a reload; anything else is false.
- `index.html` + `game.start()`: the discovery chip now reads `0/13` from the first frame on a brand-new
  save (it was stuck at the old `0/5` until the first find).
- Tests: `tests/hubBloom.test.js` (6 cases: fresh, partial, all-13 unlock, junk/undefined input,
  11 vs 12 vs 13, lantern ceiling) and two save cases for `grotto` literals.

**Checked**

- `node --test tests/*.test.js` → 58 pass, 0 fail. `npm run build` → exit 0.
- **Fresh save**: 0 lanterns, 0 flags, 0 blooms, veil up, chest absent, chip `0/13`.
- **7/13**: 7 lanterns, flags for meadow/grove/falls, those three beds bloomed, grotto shut. Walking at
  it stopped the player 5.3 m out and spoke "Something is sleeping here. 6 keepsakes would wake it."
- **13/13**: 13 lanterns, 6 flags, 6 blooms, veil gone, stepping stones and chest visible. Walked to the
  chest: sparkles 40 → 70, banner, Pip line, lid open, `grotto:true` in the save.
- **Reload**: 70 sparkles, chest still open (`taken:true`, lid −1.9), 13 lanterns, chip `13/13`.
- **Pre-iteration save** (no `secrets`, no `grotto`): booted with 15 sparkles intact, chip `0/13`, no
  growth, grotto asleep, no console errors.
- **Inputs re-verified after the iteration 15 rewrite**: keyboard walked 3.15 m, turned 1.2 rad, jumped
  0.58 m, zapped 1 bolt, paused and resumed; mouse turned −0.38 rad and zapped; emulated touch walked
  1.48 m, turned, zapped, jumped 0.58 m with the pad shown; injected gamepad walked 2.01 m, turned
  −0.72 rad, zapped, jumped, and toggled pause/resume. Each legend matched its device.
- Screenshots (`artifacts/r16-grotto2.png`, `r16-hub-full.png`, `r16-bench2.png`) drove one repair: the
  grotto's roof was a green pancake that read as a floating slab, replaced with a small mossy cap.

**Open**

- The arch pillars are still plain cylinders with no carved detail; a texture pass would help.
- The browser preview was portrait during this iteration's screenshots, so wide-screen framing was not
  inspected at 16:9.
- Touch and gamepad were again emulated/injected, not real hardware; Windows/Android builds not made.
- GitHub push still blocked on a user credential.

---

## Iteration 15 — Every device plays, and the collection reads at a glance (2026-11-28)

**Chosen because** two things were untrue of the game as shipped: the hub's rear keepsakes hid behind
the front row, and despite the brief, nothing but a mouse and keyboard could play it — no gamepad, no
touch, and the on-screen hints were written for a keyboard only.

**Changed**

- `src/game/controls.js` (new, pure): `DEVICES`, `CONTROL_LEGENDS`, `legendFor`, `deviceFromEvent`,
  `wantsTouchPad` — one place that decides what each device is called on screen.
- `src/engine/input.js`: gamepad polling through `navigator.getGamepads()` (left stick walk, right
  stick look, A jump, RT/X zap, Start pause, Y say it again) with edge detection and a deadzone;
  touch stick/look/zap/jump entry points; `device` tracking with an `onDevice` callback; keyboard zap
  on E/Enter so the gadget is reachable without a mouse. Pause and repeat keep reading the pad while
  the game is paused, because a controller child must be able to un-pause.
- `src/ui/touch.js` (new): a thumb pad, Zap and Jump buttons and drag-to-look, feeding the same Input
  values as everything else; shown only for touch.
- `src/ui/hud.js` + `index.html` + `src/style.css`: a control legend chip that always names the device
  last used, and a repeat-key hint that disappears on touch and gamepad.
- `src/world/discoveries.js`: `DiscoveryShelf` rebuilt one last time as a **low garden bench** — six
  dishes in a single row, 13 gems along the front grouped per island, nothing occluded from 3.3 m.
- `src/world/props.js`: new `buildCoveNook()` (tide pool, wet stones, driftwood, shells, starfish, dune
  tufts, shrubs) around both cove hollows and the cove cairn, and a sandy ground pass (900 shorter
  dune blades instead of 2 600 meadow spikes, 180 flowers instead of 620).
- `tests/controls.test.js` (new, 5 cases): legends are distinct and name the right controls, no legend
  tells a touch child to use WASD, device detection and thumb-pad visibility.

**Checked**

- `node --test tests/*.test.js` → 52 pass, 0 fail. `npm run build` → exit 0.
- **All four devices, in the running game**, each finding a different secret and firing the blaster:
  - keyboard: E zapped (1 bolt), W walked into the Snuggle Nest, sparkles 9→20, chip `1/13`, legend
    "WASD move · mouse look · E zap".
  - mouse: mousemove took the legend back to mouse, click zapped, walked into the Ripple Stone,
    sparkles 20→30, chip `2/13`, falls cairn showing its keepsake.
  - touch (emulated `PointerEvent`s): the pad appeared on first touch, the stick read forward = 1,
    walking found the Star Chart, the Zap button fired a bolt, legend "Thumb pad to walk · drag to
    look · zap button", repeat key hidden, chip `3/13`.
  - gamepad (injected through `navigator.getGamepads`): left stick forward = 1, RT zapped, walked into
    the Whisper Shell, chip `4/13`, cove cairn filled, legend "Left stick walk · right stick look · RT zap".
- Bug found by testing: the pad was ignored while paused, so a controller could not un-pause; the pad
  is now polled while paused and Start toggles play ↔ paused (verified `['play','paused','play']`).
- Save checks: a pre-iteration save with no `secrets` key booted at `0/13` with 9 sparkles intact and
  no error; after the four finds, a reload restored `4/13`, four shelf keepsakes, four lit gems, the
  per-island cairns and four found flags; a mid-session 13/13 state also survived a reload.
- Console: no errors or failed requests; only the screenshot tool's own WebGL `ReadPixels` warnings.
- Screenshots inspected (`artifacts/r15-shelf2.png`, `r15-cove-nook2.png`). Two shelf designs were
  rejected on sight — a raised barrel step and a 3.35 m back board that walled off the meadow — before
  the one-row bench; the first cove nook shot showed a lawn of pale spikes on sand, which drove the
  dune-grass pass.

**Open**

- The touch layer was driven with emulated pointer events, not on a real Android device; gamepad
  vibration and exotic mappings are untested.
- Two of the six keepsakes stand small on the bench (the pebble and the shell) and could be scaled up.
- Windows and Android builds were not produced this iteration. Pushing to GitHub is still blocked on a
  user credential.

---

## Iteration 14 — Secrets everywhere, and each world remembers (2026-11-28)

**Chosen because** iteration 13 put five finds in two islands and then stopped. A child who wandered
Tallybrook Falls, Pattern Peaks, Storysong Glade or Pebblecount Cove found nothing that was there for
its own sake, and every find was only ever visible back in the meadow.

**Changed**

- `src/game/secrets.js`: eight new secrets, two per remaining island, each with its own trophy, colour
  and Pip line — Ripple Stone and Bubble Jar (falls), Wind Kite and Star Chart (peaks), Singing Drum
  and Story Feather (words), Whisper Shell and Little Spyglass (cove). Added `WORLD_IDS`,
  `WORLD_LABELS`, `worldTotals()`, `progressByWorld()` and `firstFoundInWorld()` so displays never
  recount the list themselves.
- `src/world/discoveries.js`: eight new trophy shapes (stone, jar, kite, chart, drum, feather, shell,
  spyglass); `DiscoveryShelf` rebuilt as a low stepped stone stand — one dish per island, three front
  and three back, a row of gems per island that light as its secrets are found, and only that island's
  first find standing on its dish so six islands fit without crowding.
- New `KeepsakeCairn`: a stacked-stone plinth beside each island's return portal, with one dish per
  secret on that island. Finding something away from home now leaves a mark where you found it.
- `src/game/game.js`: builds a cairn per island that has secrets, refreshes the shelf and the current
  cairn on every find and on load, and ticks the cairn with the same proximity update.
- `tests/secrets.test.js`: four new cases — every world hides at least two and none sits within 10 m of
  the landing path or on an island's centre; per-world progress sums to the total and marks finished
  islands; first-find selection; every trophy kind is distinct and used.

**Checked**

- `node --test tests/*.test.js` → 47 pass, 0 fail. `npm run build` → exit 0.
- Cloud browser, real game: with a pre-iteration save in `localStorage` (no `secrets` key) the game
  booted with 12 sparkles kept, chip `0/13`, 13 unlit gems, five cairns empty, learning zero — nothing
  thrown, nothing wiped.
- Walked into both Tallybrook Falls hollows: sparkles 12 → 32, chip `0/13` → `2/13`, two banners, two
  spoken Pip lines, two `audio.star()` calls, six particle bursts, `save.secrets` written, the falls
  cairn showing both keepsakes. Repeated in Pebblecount Cove → `4/13`, cove cairn two keepsakes, shelf
  showing the falls and cove keepsakes with four gems lit.
- Reload: `4/13`, both cairns still full, shelf keepsakes and gems restored from the save, found flags
  on the spots restored.
- Screenshots at gameplay size (`artifacts/r14-cove-cairn2.png`, `r14-hub-shelf7.png`) drove two
  rebuilds: the shelf first read as a flat stone table with invisible trophies, then as a wall of posts,
  then as a blank board that blocked the meadow. The stepped stand in the final shot shows the egg,
  book, kite and drum seated on their dishes with all thirteen gems lit and the chip gold at `13/13`.

**Open**

- Two of the six keepsakes are partly hidden behind the front row from a distance; walking up solves
  it, but the back row could be raised further.
- The cove still looks sparse away from its path — the island's own art needs a pass.
- Not verified on Windows or Android, and the new chimes were not listened to on real hardware.

---

## Iteration 13 — Discovery is the reward (2026-11-28)

**Chosen because** every reward in the game hung off a sign. A child who just wanted to wander
could walk the whole meadow and get sparkles, but nothing that said *you noticed something*.

**Changed**

- `src/game/secrets.js` (new, pure): five `SECRETS` (three in the hub, two in Letterleaf Grove),
  `discover`, `sanitizeSecrets`, `collectionStatus`, `secretsForZone`, `TROPHY_KINDS`.
- `src/world/discoveries.js` (new): `trophyMesh()` (egg, lantern, chime, book, mushroom — one
  silhouette each), `SecretSpot` (mossy stone hollow, gold cradle, warm glow that only wakes up
  within 12 m, pop-and-rise reveal, a kept star once found) and `DiscoveryShelf` (mossy plinth, five
  shallow dishes, gold rim, trophies that grow in and breathe).
- `src/game/game.js`: caches spawned per island at `island.heightAtLocal`, a 2.1 m walk-in find with
  no button, reward (sparkles, two particle bursts, `audio.star()`, banner, Pip line, companion
  cheer), shelf refresh, save; `_updateSecrets` also runs the pickup streak timer.
- Juice pass: sparkle pickups play a rising run on `audio.chime()` and bounce the sparkle chip.
- `src/ui/hud.js` + `index.html` + `src/style.css`: `setDiscoveries()` and a drawn gold-diamond chip
  (`0/5`, gold when full) — no emoji, no text-only label.
- `src/engine/save.js`: `secrets` in the decode whitelist, sanitised to known ids only.
- `tests/secrets.test.js` (7 cases); `tests/save.test.js` extended for `secrets`.

**Checked**

- `node --test tests/*.test.js` → 43 pass, 0 fail. `npm run build` → exit 0.
- Cloud browser: found the Snuggle Nest and the Root Lantern by walking into them (no button),
  sparkles 42 → 62, chip `0/5` → `2/5`, two trophies on the shelf, banner and Pip line shown, and
  `secrets` in `localStorage`. Reload → both still found, chip `2/5`, two trophies. A pre-iteration
  save (no `secrets` key) boots with `0/5`, zero trophies, learning zero and difficulty auto.
- Screenshots inspected at gameplay size: `artifacts/r13-nest2.png` (nest behind the stall with its
  gold cradle), `artifacts/r13-shelf2.png` (shelf with the egg and lantern, market and tree behind).
  First pass looked flat — the egg blended into the grass — so a gold cradle and a 1.12 scale were
  added before the second shot.
- Bug found while testing: the Root Lantern's first position sat almost on the tree (1.9 m from the
  centre); moved to (-2.8, -6.2) so it reads as a hidden spot and the placement test holds.

**Open**

- Only the hub and Letterleaf Grove have secrets; the other four islands have none yet.
- Nothing was verified on Windows, the chimes were not listened to on real audio, and no child has
  played it. Pushing to GitHub is still blocked on a user credential (workspace has no remote).

---

## Iteration 12 — Questions that resize themselves (2026-11-28)

**Chosen because** the only scaffold was per-sign: a child who struggled with letters got
narrowed choices on that one plinth, walked away, and met the same size of question next time —
while a parent had no way to see or steer any of it.

**Changed**

- `src/game/progress.js` (new, pure): `SUBJECTS` (letters, words, numbers, patterns, memory),
  `subjectOfStation` (learn label → type → pad kind → island), `emptyReport`, `sanitizeReport`,
  `sanitizeDifficulty`, `recordAttempt`, `levelFor`, `narrowAfter`, `hintDelay`, `summaryOf`.
- `src/ui/progressPanel.js` (new): the grown-up corner on the pause screen — five rows with the
  subject, its tally and an Auto/Gentle/Stretch button, plus a plain-language footnote.
- `src/game/station.js`: each station knows its subject and asks the game for that subject's level
  on activate; the narrowing threshold and the hint delay now come from the level. Also fixed the
  narrowing arithmetic, which assumed a fixed threshold of two and therefore dimmed nothing on the
  first miss at Gentle.
- `src/game/game.js`: `learning` + `difficulty` state, `levelFor` passed into the station context,
  one `recordAttempt` per solved sign, `setDifficulty` (saves, re-renders, speaks a confirmation),
  pause line now reports signs met.
- `src/engine/save.js`: `learning` and `difficulty` in the decode whitelist, sanitised on read.
- `index.html` / `src/style.css`: `#progress-corner` and its styles.
- `tests/progress.test.js` (10 cases) and a new `tests/save.test.js` case for the two new fields.

**Checked**

- `node --test tests/*.test.js` → 36 pass, 0 fail. `npm run build` → exit 0.
- Cloud browser: solved a meadow sign → `patterns` recorded 1 attempt, 1 first try; the pause panel
  rendered five rows; clicking a button cycled Auto → Gentle and both the tally and the setting were
  in `localStorage`. Then, driving the real station objects: Gentle dims one wrong choice after 1
  miss, Just right after 2, Stretch after 3, the answer pad is never dimmed, and `Easier now!`
  appears with the dim. Screenshot: `artifacts/r12-grownup-corner.png` (inspected).
- Bug found and fixed during that check: at Gentle the first miss dimmed nothing (the `keep`
  arithmetic ignored the threshold).

**Open**

- The panel is one local profile; per-profile records and a parent-visible history are still
  missing. Nothing was verified on Windows or with a child, and the voice was not listened to.

---

## Iteration 11 — The Star Tree Workshop (2026-11-27)

**Chosen because** iteration 10 gave sparkles a sink but the Star Tree itself was still scenery, and
the islands had no reason to be revisited once their signs were solved.

**Changed**

- `src/game/workshop.js` (new): `ORNAMENTS` (five world shards + the market Sky Lantern),
  `workshopStatus`, `collectShard`, `canPlace`, `place`, `isComplete`, `shardSpot`, plus `ShardField`
  (plinth, cradle, crystal, ground ring, motes, 13 m light column, chime at 16 m, pickup at 2.7 m)
  and `Workshop` (two gold garlands on the tapered trunk, six hooks with dashed outline sprites,
  pop animation, completion decoration).
- `src/world/ornaments.js` (new): one shape painter for star/moon/flower/bell/shell/lantern (plus
  magnet and rainbow for market cards), `shapeDataUrl` for the pouch and cards,
  `shapeOutlineTexture` for the tree hints, `createOrnamentMesh` for the hanging 3D ornaments.
- `src/game/game.js`: shard/placed sets, hook aiming inside the existing aim cone, zap-to-hang,
  collection chime + banner + pouch refresh, completion speech chain (Momo then Pip), goal text,
  save/load, `marketItems()` with drawn pictures, shard pouch refresh on purchase.
- `src/game/shop.js`: fourth gift (`lantern`, 90 sparkles, `shape: 'lantern'`), jar spacing now
  derived from `SHOP_ITEMS.length`, drawn shapes for magnet/bell/rainbow, wider counter.
- `src/engine/save.js`: `shards` and `placed` in the decode whitelist; old saves default to `[]`.
- `src/ui/hud.js`: `setShards`/`setBadges` picture rows, drawn card icons, optional toast image.
- `src/style.css`: market grid is two-by-two now that there are four gifts.
- `src/game/blaster.js`: arrival test includes the frame's travel distance, so a homing bolt cannot
  tunnel past a small target at 3–4 fps.
- `tests/workshop.test.js` (new, 9 cases) covers stock, market gating, single pickup, single
  placement, market ornament without a shard, set completion, shard placement clear of arches and
  signs, and the save round trip. `tests/shop.test.js` and `tests/save.test.js` updated for four
  gifts and the two new save fields.

**Checked**

- `node --test tests/*.test.js` → 26 pass, 0 fail. `npm run build` → exit 0.
- Cloud browser, real render loop: all five beacons found and collected (pouch showed five drawn
  pictures), Momo's market showed four drawn cards and the Sky Lantern was bought for 90 sparkles
  (purse 97 → 7), five ornaments hung by zapping their outlines from the meadow path, and the sixth
  completed the set: canopy went luminous mint, sixteen coloured glows and a crown star appeared, the
  badge and "The Star Tree is decorated" goal showed, and Momo then Pip spoke. After a reload the
  six ornaments, the decoration, the badge and the pouch state were all still correct.
- Screenshots: `artifacts/r11-beacon-final.png`, `r11-shard-beacon.png`, `r11-pouch.png`,
  `r11-tree-hooks2.png`, `r11-tree-four.png`, `r11-market-lantern.png`, `r11-tree-final.png`.
- Fixed while inspecting: garlands clipped through the octagonal trunk (radii now clear the flat
  faces), ornaments floated beside the trunk and read edge-on (now flush and facing the path),
  ornaments were too small (scale 1.45), the shard beacon was blown out (calmer glow and column), the
  decorated canopy turned patchwork (single mint-gold wash), and the pouch row carried a text label
  and overlapped the zone chip (pictures only, plated icons).

**Open**

- Audible narration, real pointer-lock clicking on Windows, both Windows executables and a child
  playtest are still unverified. At ~3–4 fps in the cloud browser one of six hook zaps needed a
  second attempt; on 60 fps hardware the homing bolt reaches the same target in a few frames.
  The Sky Lantern is the only sparkle-gated ornament, so a child who owns every gift has one target
  fewer to save for.

---

## Iteration 9 — Gentler second chances (2026-11-27)

**Chosen because** the game's weakest moment for a five-year-old was failing the same question
 twice: the prompt repeated, the hint arrived, but the question itself stayed exactly as hard.

**Changed**

- `src/game/station.js`: `mistakes` counter, `_narrowChoices()` called from the wrong-answer timer.
  After two misses, one wrong choice per miss dims to `pad.state === 'dim'`, stopping at two
  choices; the answer pad is never dimmed; `pick` and `pattern` only. `activate()` resets the
  counter so a fresh approach starts whole.
- `src/world/pads.js`: new `dim` pad state (grey-lilac ring, 0.22 face opacity, scale 0.8, no glow)
  so a removed choice still reads as part of the plinth instead of vanishing.
- `src/game/game.js`: a small star sprite above each arch, shown once `stars[portal.def.to]` is set;
  `_refreshPortalBadges()` runs after loading a save and after collecting a Starberry, and dims the
  finished arch's beacon.
- `tests/station-recovery.test.js`: five cases for the narrowing rules.
- Version `0.1.2-beta.1` across `package.json`, `package-lock.json`, the lock chunks, `START-HERE`,
  README; Windows workflow now takes the release tag as a `workflow_dispatch` input and runs the new
  tests.
- New persistent records: `AGENTS.md`, `ROADMAP.md`, `CHANGELOG.md`, this log.

**Verified**

- `node --test tests/save.test.js tests/station-recovery.test.js` → 9 pass, 0 fail.
- `npm run build` → exit 0 (only the known chunk-size warning).
- Cloud browser, real render loop: two wrong zaps at `meadow-shape` → pads `active, dim, active`,
  2 aim candidates, `Easier now!`; leave → all sleep; return → all active, `mistakes` 0. Page error
  collector empty.
- `_collectStarberry('peaks')` → arch badge visible at world y 6.0, beam 0.04, goal chip updated.
- Screenshots: `artifacts/r9-easier-choices.png` (triangle bright, circle bright, square greyed),
  `artifacts/r9-arch-star.png` (star above the Pattern Peaks arch).

**Open**

- Windows beta `0.1.2-beta.1` shipped: Actions run #4 passed, the ZIP was attached and the prerelease
  published; a signed-out download returned HTTP 200 with SHA-256
  `ae6e5f7716df87a8bc55a696d9b9c8d491784c75be594872b9fc3929612e6020` and three intact entries.
- Audible speech, real pointer-lock zapping and the packaged Windows builds were not exercised.
- The two pattern signs still lack the full wrong/correct capture promised in iteration 6.
- A human Windows playtest is still needed: both editions, R and the button, the faded choice, an
  arch star, offline narration, save and reopen, the installer shortcut, and uninstall.

**Next actions**

1. Confirm the Windows workflow's next dispatch only passes `tag`; the extra `version` input silently
   aborts the dispatch.
2. Add a grown-up progress corner to the pause screen (letters, numbers, patterns, memory counts).
3. Finish the pattern-sign wrong/right evidence, including the filled blank after a reload.

---

## Iterations 6–8 — pattern signs, resume, replay (2026-11-27)

- Iteration 6: `pattern` station type with an animated picture row, `seq` sign plate, filled answer
  slot on solve/restore, double-sided tiles, 29-station audit with no placeholders.
- Iteration 7: resume on the last island with its own greeting, previous-checkpoint backup, save
  sanitising, ending flag restored, no sixth Starberry from meadow practice signs.
- Iteration 8: **R** and the on-screen button repeat the nearest sign; leaving a sign clears only
  its own bubble; memory signs replay their light sequence.
- Windows beta 0.1.1-beta.1 built by GitHub Actions, published as a public prerelease, downloaded
  unauthenticated (HTTP 200) and matched to its SHA-256.
