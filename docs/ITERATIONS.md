# Iteration History

A running record so future sessions do not repeat work. Newest first.

---

## Iteration 25 - The moon turns, and the loop is played

- **Post-cap wishes now change the arbor.** `MOON_PHASES` in `src/game/gifts.js` (full, waning, half, crescent, new); `moonPhase(wishes)`; each wish moves the bead one step, shrinking and narrowing it (`scale`, `width`) and recolouring and spreading its halo (`glow`), with a matching `lamp` tint. `WISH_CAP` 999 is a sanitiser only; the firefly flock still stops at twelve so the constellation stays legible. Copy lives in the phase data, not `game.js`.
- **Three attempts, third kept.** A sliding dark bead read as a googly eye; blue lanterns read as "the lights went out"; the kept method keeps lanterns honey-warm and puts the phase on bead size/silhouette + halo colour + one Pip line. Bead enlarged to 0.145 and the crescent narrowed to 0.46 width so it reads from the path.
- **Toast clutter**: `Hud.toast` refreshes a repeated line instead of stacking identical cards.
- **Proof by playing**: Leafwhisk suction gathered 6 petals, 6 sun puffs and 6 motes in the grove, falls and words (basket 9/8/8); nine real aimed gifts filled the bed 3/3/3 with one sound/toast/line each; six more overflowed into the arbor (five family chimes, then one `audio.arbor()` wake with no chime); four real wishes each gave one `audio.wish()`, one toast and one phase line and moved the moon; no events fired on idle frames or on an empty-basket zap.
- **State**: reload restored arbor 6 / wishes 4 / new moon / 6 lit / moth / 4 fireflies; legacy save booted arbor 0 with a hidden chip; calm motion held the moth and the glow steady; keyboard, mouse, touch and gamepad all reached walk, look, zap, switch, jump, hold and pause/resume.
- **Tests/build**: 80 pass, build exit 0. Captures `artifacts/iter25-*.png`.
- **Not verified**: real Android/controller hardware, Windows build; GitHub push still blocked on a user credential.

## Iteration 24 - The Moon Arbor

- **The dead end closed:** once all three garden spots are full, a zap at the garden sends the gift to a **Moon Arbor** behind the bed — two vine-clad posts, an arch and six paper lanterns, visible and unlit from the first visit. Rules in `src/game/gifts.js` (`allSpotsFull`, `giveArbor`, `ARBOR_MAX` 6, `WISH_MAX` 12), art in `src/world/garden.js` (`_buildArbor`, `setArbor`, `arborFlourish`).
- **Six lights wake it:** each gift hangs one light (family chime, “A light for the arbor!”, one per-stage line); the sixth plays the new `audio.arbor()` swell, toasts “The Moon Arbor is awake!” and a moon moth moves in.
- **Wishes forever:** every gift after that is a wish — new `audio.wish()`, “A wish for the arbor!”, a firefly per wish up to twelve; the arbor never refuses for being full, so a bundle always has somewhere to go. An empty basket is the only refusal and answers with words alone.
- **Any family, any spot:** the overflow picks whichever bundle the basket actually holds, and the last spot filling speaks `ARBOR_HINT` once, so the arbor is never a secret.
- **Save:** `arbor` and `wishes` are sanitised and default to zero; legacy saves boot with a sleeping arbor.
- **Calm motion:** glow steady, moth still with wings held open, fireflies fixed; the setting is read every frame.
- **Evidence:** five chime/light calls then one wake (no double-fire, no family chime on the wake), one wish call with firefly 0→1, silent empty refusal, reload restoring 6/1 with six lit lanterns and the moth, legacy save at 15 sparkles, keyboard/mouse/touch/pad all reaching walk, look, zap, switch, jump, hold and pause/resume. 80 tests pass, build exit 0. Screenshots `artifacts/iter24-*`.
- **Not verified:** Android/controller hardware, Windows build. GitHub push still blocked on a user credential.

## Iteration 23 - Pip's garden

- **A place for every bundle:** `src/game/gifts.js` (pure rules, lines, sanitisers) and `src/world/garden.js` (art) add one authored bed on the meadow path with three spots — a posy bed for petals, a stone sun bowl for dust, a lantern post for motes — each accepting three gifts. Placement is `GARDEN` in `src/content.js`.
- **Giving is the bolt verb:** aim at a spot (0.2 rad, 6.5 m, meadow only, after Momo and before scenery) and zap. One gift spends one bundle, plays `audio.give(kind)` (petal chime + rustle, dust whoomph + crackles, mote glass pings), toasts, speaks one of three per-stage Pip lines, grows the spot and saves. A full spot or empty basket answers with a spoken line and spends nothing — no sound, no particles.
- **What grows:** the posy bed pops three flower clusters (three stems each), adds a butterfly; the bowl warms its coals and glow, adds flames at stage two and rising embers; the post lights one hanging lantern per gift, adds motes above it at full. All three read from the path before and after.
- **Basket:** `_finishGather` stocks only petal/dust/mote (the hub leaf stays a celebration), `#chip-bundles` shows the counts and hides when empty, and the first bundle of a session gets one spoken pointer to the garden 2.1 s after the gather line.
- **Save:** `bundles` and `gifts` are sanitised (`BASKET_MAX` 9, `GIFT_MAX` 3) and default to empty, so old saves boot with an empty garden.
- **Calm motion:** flames hidden, embers steady, butterfly still, motes fixed; the setting is read every frame so toggling it later also settles a warm garden.
- **Evidence:** one audio/toast/voice per gift for all three families; refusal = one voice line, no sound, nothing spent; reload and resume restored 3/2/3 with three clusters and three lit lanterns; legacy save booted with 15 sparkles and no errors; keyboard/mouse/touch/pad still reach walk, look, zap, switch, jump, hold and pause/resume. 78 tests pass, build exit 0. Screenshots `artifacts/iter23-*`.
- **Not verified:** Android/controller hardware, Windows build. GitHub push still blocked on a user credential.

## Iteration 22 - The Leafwhisk goes everywhere

- **Three new families:** beside the leaf drift, a **petal** windflower patch, a **dust** vent and a **mote** perch, each authored in `src/world/curios.js` with a base group that never vanishes, a remnant that appears after gathering, and a gather group that shrinks and siphons. One prop per themed island sits in `src/content.js`; the hub's drifts are untouched.
- **Per-family behaviour:** petals sway and flutter, dust lifts plumes and flurries, motes orbit and tighten (and their sea glass dims) as the whisk pulls. The bundle that pops out is family-specific: a ribboned posy, a golden puff, a glassy mote lantern.
- **One hello per family per session:** `familyReward(type, greeted)` in `src/game/curios.js`; the game keeps a `greeted` Set. Repeats pay nothing and stay silent but still work, still pop a bundle and still toast. Nothing is timed, lost or gated.
- **Evidence:** instrumented gather on grove petal (+3, whoosh 0.33→1.0, pop/collect/toast/voice), two repeats (0, no voice), peaks dust (+2), cove mote (+3); resumed save booted at 72 sparkles and still paid the petal hello once; legacy save at 15 sparkles; keyboard/mouse/touch/pad all reached walk, look, zap, switch, jump and pause (and pad Start now resumes); bolt and listening-stone regressions clean; zero page errors; screenshots idle/switch/mid-suction in two worlds/collection/calm. 74 tests pass, build exit 0.
- **Not verified:** Android/controller hardware, Windows build. GitHub push still blocked on a user credential.

## Iteration 21 - The Leafwhisk

- **A real second tool:** `src/game/tools.js` holds the two tools and the intake's rules (`inSuction`, `suctionStrength`, `GATHER_SECONDS`); `src/world/whisk.js` builds the Leafwhisk and its debris. `Q`, right-click, the 🌀 touch button and gamepad B switch, and the HUD chip names the active tool on every device.
- **The model:** a short teal canister with a cream belly, gold collar, flared cream snout with a gold lip, dark throat with three spinning blades, a pouch that fills, a nozzle glow and a faint cone of air. It sits in the bottom-right corner like the Starbolt.
- **The gather:** holding the trigger with a leaf drift in the wide cone (7.5 m, cos 0.88) sends two faceted leaves and the odd dust puff to the mouth every 0.07 s on a curve, spinning and shrinking; the whoosh (`suckStart`/`suckSet`) and the cone rise with the load. The pile shrinks as it empties, rests for 22 s and returns; nothing is lost and nothing is timed.
- **The hello:** the first gather of a drift in a session drains it, pops a ribboned bundle with `audio.pop`, pays 3 sparkles and gives Pip's line; later gathers pay nothing but always work.
- **Calm motion:** no bob, no sway, no arc (straight paths) and a slower fan.
- **Evidence:** switch and chip on keyboard/mouse/touch/pad; 10-14 leaves in flight and pile scale 1 → 0.64 at mid-suction; drain, bundle and +3 sparkles; keyboard walk 2.59 m/look −0.189/suction 0.7, right-click switch and click bolt, touch tool + hold 0.48 + stick 2.03 m + jump, pad B + RT hold 0.38 + stick 2.03 m + look −0.121 + pause/resume; calm group y fixed at −0.35; bolt rustle/collect and stone scan/chime unchanged; resumed 15 → 20 sparkles; legacy save 15 sparkles, `0/13`; zero page errors. 72 tests pass; `npm run build` exit 0.
- **Not verified:** Android/controller hardware, Windows build. GitHub push still blocked on a user credential.

## Iteration 20 - Curious things that answer back

- **Twelve reacting props, two per island:** leaf drifts, sun crystals and listening stones, placed from `curios` data in `src/content.js` and built by `CurioField` in `src/world/curios.js`.
- **Leaf drift:** nine faceted leaf clumps, twenty-eight blades, curled rim leaves, a twig and a mushroom. A bolt scatters it (`audio.rustle()`, 3 sparkles the first time, toast and a Pip line) and it gathers itself back after 22 s; a second zap pays nothing.
- **Sun crystal:** four faceted shards with gold flecks on a slate slab and moss cluster. A bolt rings it (`audio.crystal()`, 4 sparkles the first time) and it regrows after 18 s.
- **Listening stone:** a leaning menhir with weathering, moss at the foot, a pebble ring and one carved gold rune. The existing scanning gaze (0.7 s within 4.6 m) lights the rune, plays `scan` + `chime(3)` and speaks a true one-line fact; the first listen pays 3 sparkles and repeats are free.
- **No new controls:** aiming, bolts and the scan gaze are the existing systems, so keyboard, mouse, touch and gamepad all work unchanged; a curio is only picked when no sign, creature, hook or Momo is in front of it.
- **Evidence:** leaf 20 → 23 sparkles with rustle/collect/toast/Pip; crystal 20 → 25 with the crystal chime; stone lit with scan/chime/fact and a free repeat; regrow verified by running the timer down; 13/13 still opens the grotto, 12/13 still keeps it shut, a pre-iteration save still boots at 15 sparkles and `0/13`; zero console or page errors; keyboard, mouse, emulated touch and injected gamepad all reached walk, look, zap, jump and pause. 66 tests pass; `npm run build` exit 0.
- **Not verified:** Android/controller hardware, Windows build. GitHub push still blocked on a user credential.

## Iteration 19 - The meadow answers when it grows

- **Data-driven announcement:** `growthChange(before, after)` in `hubBloom.js` diffs two `hubBloom()` results into `kinds`, added flags/blooms, `stageIndex`, `stageChanged` and a short line. The line names one or two things that actually grew and only adds "The far lanterns are still sleeping." when a new stage begins.
- **Flourish:** `HubGrowth.flourish(change)` puts a warm mote on each new detail plus one gentle scale swell (per-kind amounts, motes lifted onto the art); `flourishAt(point)` does the same for the chest. No camera or input changes.
- **A chime of its own:** `audio.grow(stage)` is a four-note rise in the stage's key with a low pad and shimmer, distinct from `collect()` and `star()`.
- **Wired on every route:** keepsakes celebrate immediately (chime + flourish) with Pip's line 1.9 s later so it does not cut off the keepsake line; the chest celebrates at the chest; resumed saves and reloads stay silent; at 13/13 the grotto's own line is used instead of a second one.
- **Calm motion:** `src/engine/motion.js` follows the OS setting and remembers an explicit choice; a pause-screen button toggles it. Calm turns the flourish into a light mote only.
- **Evidence:** 3→4 lantern+pennant+flag with `grow(2)`; 6→7 adds paver and rim with `grow(3)`; 9→10 adds stone and firefly with `grow(4)`; 12→13 opens the grotto with `grow(5)` and the veil gone. A resumed 7/13 save, a reload, a duplicate keepsake and an ordinary sparkle pickup each produced no flourish. Reduced motion: 0 pulses, 6-particle burst. Keyboard, mouse, emulated touch and injected gamepad all reached walk, look, zap, jump and pause during a flourish. A pre-iteration save booted at 15 sparkles, `0/13`, no errors.
- **Tests:** 63 pass (two new hubBloom cases); `npm run build` exit 0.
- **Not verified:** Android/controller hardware, Windows build. GitHub push still blocked on a user credential.

## Iteration 18 - The hub grows all the way

- **Staged growth data:** `hubBloom()` now returns `pavers` (7, two keepsakes at a time), `pennants` (one per keepsake), per-island `fills` (planter fill 0–1), `stones` (5, one per keepsake past eight), `rim` (9, waking from the fifth), `fireflies` (4) and `veil` (0–1) plus a named `step`. Lanterns, flags, blooms and the grotto rule are unchanged, and everything still comes from `sanitizeSecrets`.
- **New hub geometry:** `_buildPavers()` lays hexagonal flagstones with a darker lip and moss tufts; `_buildPennants()` hangs a sagging rope with thirteen triangular pennants between two posts above the planters. Planter stems are separate groups, so a bed fills one keepsake at a time.
- **Grotto clearing wakes gradually:** rim stones, stepping stones and arch fireflies appear one at a time, and the veil thins and brightens as the last keepsakes arrive — it still only parts at thirteen.
- **Lanterns rebuilt** as framed glass lamps (sill, lintel, corner bars, roof, finial, hanging hook) instead of pale cubes, so lit versus unlit is obvious in daylight.
- **Keepsake row evened again:** pebble display scale 1.55 → 1.25, kite on a wooden stand with a longer string, drum with an inset cream head and dark rim, shell flatter and wider.
- **Evidence:** fresh 0·0·0·0; 4/13 four lanterns, 2 flags, 4 pennants, 2 pavers, planters 5·3·0·0·0·0; 7/13 7/3/7/4 with rim 3 and the child stopped 5.21 m out with Pip's hint; 10/13 10/5/10/5, stones 2, rim 6, one firefly, veil still up; 13/13 13/6/13/7, stones 5, rim 9, fireflies 4, veil gone, chest 40 → 70 sparkles, `grotto:true`, and a reload kept it all. A pre-iteration save booted at 15 sparkles, `0/13`, no errors.
- **Inputs:** keyboard (4.64 m, 1.04 rad, jump, zap, pause↔play), mouse (1.34 rad under pointer lock, click zap), touch (0.92 m, −0.21 rad, zap, jump, pad shown) and gamepad (3.92 m, −0.62 rad, zap, jump, play↔paused) matched their legends.
- **Tests:** 61 pass (three new hubBloom cases); `npm run build` exit 0.
- **Not verified:** Android/controller hardware, Windows build. GitHub push still blocked on a user credential.

## Iteration 17 - Carved stone, and a real 16:9 inspection

- **The arch is carved:** plinths, tapered eight-sided shafts with three carved bands, capitals with gold trim, a diamond keystone with a star inset, a wall lantern on each column, ivy at the capitals and a seamed mossy threshold. The bead-like vines were removed.
- **The grotto is a place:** a six-boulder outcrop closes the back, the moonwell gained a rim ring, lily pads and nine rim stones, ferns, mushrooms, moss patches and a stone bench fill the inside, and the chest stands on a cut stone footing.
- **The clearing is dressed:** `_buildTreeline()` adds eight trees, nine shrubs and a worn pebble-and-tuft approach; the scatter blocker around the grotto went from 7.5 m to 10 m so nothing grows through the arch.
- **Swept at gameplay size:** lantern glows no longer blow out (sprite 1.5 → 0.95, pulse 0.42 → 0.26), flower beds became raised wooden planters with five dainty stems instead of a fat bloom on a bowl, and meadow flowers got thinner stems and smaller petals.
- **Keepsake reads fixed without touching the row:** open book with pages, thicker pebble with chips, kite tied to its dish and sitting lower, flatter scallop shell facing the child, terracotta drum.
- **Evidence at 1280×720:** fresh → `0/13`, nothing grown, veil up, chest hidden; 7/13 → 7 lanterns, 3 flags, 3 blooms, veil up, child stopped 5.21 m out with Pip's "6 keepsakes would wake it"; 13/13 → 13/6/6, veil gone, chest collected 41 → 71 sparkles, `grotto:true`, and a reload kept the open lid, 70 sparkles and 13 lanterns. A pre-iteration save booted at 15 sparkles, `0/13`, no errors.
- **Inputs:** keyboard (walk 3.92 m, turn 0.8 rad, zap, jump, pause/resume), mouse (3.05 rad look under pointer lock, click zap), emulated touch (walk 0.69 m, look −0.32 rad, zap, jump, pad visible) and injected gamepad (walk 3.92 m, look −0.58 rad, zap, jump, play↔paused) all matched their legends.
- **Tests:** 58 pass; `npm run build` exit 0. A `ReferenceError` from materials used outside `_buildGrotto` broke the boot and was caught only by loading the page — fixed.
- **Not verified:** Android/controller hardware, Windows build. GitHub push still blocked on a user credential.

## Iteration 16 - The hub grows, and a grotto wakes

- **Discovery now changes the place.** `src/game/hubBloom.js` (pure) maps a saved keepsake list to lanterns lit, island flags, bloomed beds and a grotto state; `src/world/growth.js` builds those in the hub: 13 lantern posts down the walk-up path (one per keepsake), six island bunting flags by the market, six flower beds by the bench, and the Moonwell Grotto behind the Star Tree.
- **The grotto** is a stone arch with a shimmering veil, stepping stones, a moonwell ringed with stones, two crystals, fireflies and a banded chest. While it sleeps it nudges the player back at 5.2 m and Pip explains how many keepsakes would wake it. At 13/13 the veil parts, the stones appear, and walking to the chest gives 30 sparkles, a banner and a Pip line — saved as `save.grotto`, so it stays open across reloads.
- **Even keepsake sizes:** `trophyDisplayScale()` draws the pebble at 1.55×, the shell at 1.45×, the jar at 1.3× and the rest near 1.0×, keeping iteration 15's single readable row.
- **Fixed a fresh-save bug:** the discovery chip showed the old `0/5` until the first find; it now reads `0/13` from the first frame.
- **Evidence:** fresh save → nothing grown, grotto shut; 7/13 save → 7 lanterns, 3 flags, 3 blooms, grotto shut and the player stopped 5.3 m out with a spoken hint; 13/13 → everything lit, veil gone, chest collected for 30 sparkles (40 → 70), `grotto:true` saved, and a reload kept the open chest and sparkles. A pre-iteration save with no discovery keys boots at `0/13` with its sparkles intact. Keyboard, mouse, emulated touch and injected gamepad all walked, looked, zapped, jumped and paused with matching legends.
- **Tests:** 58 pass (`tests/hubBloom.test.js` 6 cases, two new save cases). `npm run build` exit 0.
- **Not verified:** real Android/controller hardware, Windows build, and 16:9 framing (the preview was portrait this iteration). GitHub push still blocked on a user credential.

## Iteration 15 - Every device plays, and the collection reads at a glance

- **Input parity, which the game did not actually have.** `src/engine/input.js` gained gamepad polling (`navigator.getGamepads()`: left stick walk, right stick look, A jump, RT/X zap, Start pause, Y repeat, 0.24 deadzone, edge-detected buttons), a keyboard zap on E/Enter, touch entry points (`setTouchStick`, `addTouchLook`, `touchZap`, `setTouchJump`) and device tracking with an `onDevice` callback. `src/ui/touch.js` adds a thumb pad, Zap and Jump buttons and drag-to-look, shown only on touch. `src/game/controls.js` (pure) owns what each device is called, and a HUD chip always names the device last used; the repeat-key hint disappears on touch and gamepad.
- **Fixed a real controller bug found while testing:** the pad was not polled while paused, so Start could pause but never resume. The pad is now read while paused; movement and zapping stay gated on being in play.
- **Shelf legibility.** `DiscoveryShelf` is now a low garden bench: six dishes in one row at 0.8 m, 13 gems along the front grouped per island, a gold rail and a small back rail. Nothing occludes anything from 3.3 m, and it no longer walls off the meadow.
- **Cove dressing.** `buildCoveNook()` in `src/world/props.js` rings each cove hollow and the cove cairn with a tide pool, wet stones, driftwood, shells, starfish, dune tufts and shrubs; the sand ground cover is 900 short dune blades instead of 2 600 meadow spikes, with 180 flowers instead of 620.
- **Evidence:** all four devices each found a different secret and fired the blaster in the live game (keyboard `1/13`, mouse `2/13`, touch `3/13`, gamepad `4/13`), each with its own legend text, particles, chime, spoken Pip line and permanent reward; save verified on reload, after a mid-session find, and from a pre-iteration save with no `secrets` key (`0/13`, sparkles kept, no throw). No console errors.
- **Tests:** 52 pass, including five new `tests/controls.test.js` cases. `npm run build` exit 0.
- **Not verified:** real Android hardware (touch driven with emulated pointer events), controller vibration, Windows build. GitHub push still blocked on a user credential.

## Iteration 14 - Secrets everywhere, and each world remembers

- **Gap closed:** iteration 13's five finds covered only the hub and Letterleaf Grove. Eight new hollows (`src/game/secrets.js`) put two on each remaining island - Tallybrook Falls (Ripple Stone, Bubble Jar), Pattern Peaks (Wind Kite, Star Chart), Storysong Glade (Singing Drum, Story Feather) and Pebblecount Cove (Whisper Shell, Little Spyglass) - all off the landing path (a test enforces >10 m from it and >6 m from an island's centre).
- **Eight new trophy shapes** in `src/world/discoveries.js`: smooth ripple pebble, glass bubble jar, kite with ribbons, star chart, laced drum, quill feather, fan shell and spyglass.
- **Each world shows its own finds.** `KeepsakeCairn` is a stacked-stone plinth beside every island's return portal with one dish per secret hidden there; finding something away from home now leaves a mark where you found it.
- **The hub shelf became a collection display.** `DiscoveryShelf` is a low stepped stone stand: one dish per island (three front, three back), the island's first find standing on it, and a row of gems per island that light as its secrets are found. `progressByWorld`, `worldTotals` and `firstFoundInWorld` keep the counting in one place; the HUD chip still shows the total (`N/13`, gold when complete).
- **Sanitising unchanged and verified:** unknown ids are dropped, duplicates collapse, `save.secrets` missing entirely loads as zero. No new save keys, no new input, no timers or locks added.
- **Tests:** 47 pass (`tests/secrets.test.js` gained four cases: per-world coverage and off-path placement, per-world progress and totals, first-find selection, trophy distinctness). `npm run build` exit 0.
- **Browser evidence:** pre-iteration save → `0/13`, empty shelf and cairns, sparkles preserved; walked into both falls hollows (sparkles 12→32, two banners, two spoken lines, two star chimes, six bursts, saved, cairn filled); both cove hollows (→ `4/13`, cove cairn filled); reload restored chip, shelf, gems, cairns and found flags.
- **Visual repairs made in-pass:** the shelf was rebuilt three times because it read as a flat table (trophies invisible), then a ring of posts (everything occluded), then a board that walled off the meadow; the final stepped stand seats trophies on their dishes with the islands' gems below. The falls hollows were re-seated after the first screenshot showed one clipping the grass.
- **Not verified:** Windows/Android, real audio. The cove island itself is still sparse away from its path, and two back-row keepsakes are partly occluded from a distance.

## Iteration 13 - Discovery is the reward

- Added a reason to wander that has nothing to do with signs: five hand-placed hidden hollows (`src/game/secrets.js`), three in Sunbeam Meadow and two in Letterleaf Grove. Nothing marks them from a distance; a mossy stone ring, a gold cradle and a warm glow that only wakes within 12 m is all a child gets.
- Finding one takes no input at all: walk within 2.1 m and it is yours. The reward is layered - the object rises and turns with two particle bursts, `audio.star()`, a banner naming it, a Pip line, ten sparkles and a companion cheer - and it is permanent.
- Every find becomes a trophy on the new Discovery Shelf (`src/world/discoveries.js`) on the meadow path: a mossy plinth with five dishes and a gold rim, where the egg, lantern, chime, book and mushroom grow in and then breathe gently. The HUD gained a drawn gold-diamond chip reading `N/5` that turns gold when the set is complete.
- `save.secrets` holds found ids, sanitised to known ids on load; pre-iteration saves open with an empty list and `0/5`.
- Small interaction pass: sparkle pickups now climb a short rising run of notes and bounce the sparkle chip, so sweeping up a row sounds like a tune rather than repeated beeps.
- `tests/secrets.test.js` (7 cases) covers stock, reward shape, off-centre placement, single-pay discovery, the count/completion readout, and save sanitising; `tests/save.test.js` gained `secrets` round-trip and old-save cases. `node --test tests/*.test.js` -> 43 pass; `npm run build` -> exit 0.
- Browser evidence: two finds by proximity (sparkles 42 -> 62, chip 0/5 -> 2/5, two shelf trophies, banner and Pip line, saved), reload kept both, a pre-iteration save opened at 0/5 with an empty shelf. Screenshots inspected: `artifacts/r13-nest2.png`, `artifacts/r13-shelf2.png`. The first shelf shot showed the egg blending into the grass, so a gold cradle and slightly larger item were added.
- Not verified: Windows, real audio, a child playtest. Four islands still have no secrets.

## Iteration 12 - Questions that resize themselves

- Adaptive difficulty is now per subject and per child. `src/game/progress.js` keeps a small tally for letters, words, numbers, patterns and memory (`attempts`, `firstTry`, `misses`); `subjectOfStation` files a sign by its `learn` label, then its type, then its pad kinds, then its island, so every sign belongs to exactly one subject.
- `levelFor` keeps a subject at Just right until there is evidence: two solved signs with first-try answers under half the time turn it Gentle; three solved signs with 80% or better turn it Stretch. A grown-up's explicit choice always beats the statistics.
- Level changes the question, not the reward: Gentle narrows after the first miss and hints in 1.9 s, Just right after two and 2.7 s, Stretch after three and 3.6 s; the 6 sparkles and the Starberry rules are identical everywhere.
- The pause screen gained the grown-up corner (`src/ui/progressPanel.js`, `#progress-corner`): one row per subject with "N signs · M first try" and an Auto/Gentle/Stretch button that saves immediately and speaks a short confirmation.
- `save.learning` / `save.difficulty` are decoded through `sanitizeReport` / `sanitizeDifficulty`, so junk is discarded and pre-iteration saves open clean.
- Fixed: `_narrowChoices` computed `keep` from a hard-coded threshold of two, so at Gentle the first miss dimmed nothing. It now derives the target from `narrowAfter(level)`; verified at all three levels by driving the real station objects (1/2/3 misses, answer never dimmed).
- `tests/progress.test.js` (10 cases) covers subject filing, tally purity, auto thresholds, per-subject independence, explicit settings, thresholds/delays, sanitising and the summary text; `tests/save.test.js` covers the two new fields and old-save compatibility. `node --test tests/*.test.js` -> 36 pass; `npm run build` -> exit 0.
- Not verified: a Windows run, audible narration, or a child playtest. The record is one local profile, not per-profile.

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
