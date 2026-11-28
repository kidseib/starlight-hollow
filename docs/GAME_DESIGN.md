# Starlight Hollow — Game Design & Technical Reference

_A first-person adventure for explorers aged 5–7. Everything is spoken out loud; nothing requires reading._

---

## 1. Vision

Starlight Hollow is a gentle, colourful first-person adventure. The child is a small explorer with a
friendly blaster, a firefly-bird companion called **Pip**, and five floating islands to discover. Every
island hides a **Starberry**; bringing all five to the sleeping **Star Tree** in the hub wakes it up.

Pillars:

1. **Adventure first.** Exploration, friends, sparkles and secrets come before any question.
2. **Playable by ear.** Every instruction is voiced; every answer pad carries a picture or a glyph a
   five-year-old can recognise.
3. **Never punishing.** Wrong answers get "Try again!", a flashing pad, a repeated prompt and an
   easier hint. Nothing is lost, ever.
4. **Charming.** Rounded shapes, warm palettes, bobbing creatures, bell-like music.

## 2. Story & characters

- **The Star Tree** has gone to sleep. Five Starberries, one per island, will wake it.
- **Pip** — a firefly-bird companion. Floats beside the explorer, cheers when a sign is solved,
  droops when a zap misses, and drifts toward the nearest unsolved sign (with a spoken line) when a
  child stands still for nine seconds with nothing to do. Pip is the narrator voice (`🐣`).
- **Puffkins** — round, bouncy friends (one per island at least). Zapping one befriends it and it
  tells a silly fact.
- **Grumbleweeds** — harmless grumps. Zapping one makes it giggle away for two sparkles.
- **The explorer** — the player, carrying the Star Blaster.

## 3. World

| Zone | Id | Theme | Curriculum focus | Signs | Starberry |
|---|---|---|---|---|---|
| Sunbeam Meadow | `meadow` | Hub, green/blue | Shapes, colours (tutorial) | 2 | — (tree) |
| Letterleaf Grove | `grove` | Mint forest | Letters, beginning/ending sounds, spelling SUN | 5 | ✓ |
| Tallybrook Falls | `falls` | Teal water | Counting, adding, taking away, comparing, number order | 5 | ✓ |
| Pattern Peaks | `peaks` | Lavender sky | Patterns, shape recognition, memory (3 and 4 lights) | 5 | ✓ |
| Storysong Glade | `words` | Honey/coral | Beginning sounds, rhyme, word building (CAT, DOG), syllables, picture memory | 6 | ✓ |
| Pebblecount Cove | `cove` | Sand/turquoise | Counting a group → numeral, pictured addition, take-away, numeral→group, more/less, picture memory | 6 | ✓ |

The meadow holds five arches (plaque + icon + glowing veil), one per island. Islands are 420 units
apart on the X axis so only one is in the frustum at a time.

## 4. Core systems

### Stations (the educational unit)
`src/game/station.js`. A plinth, a floating sign plate, and 2–4 answer pads facing the player.

Types: `pick` (one right pad), `sequence` (zap in order), `memory` (watch the lights, copy them), `pattern` (read the animated row and zap the missing shape or picture). Pattern signs use a miniature `seq` plate; solved blanks show the answer on return.

Behaviour: activates at 10.5 m, deactivates at 18 m, prompts are voiced and shown in the speech
bubble, wrong answers flash the pad + "Try again!" + repeat + hint after ~2.7 s, correct answers
solve the plinth (⭐ marker), burst sparkles and award 6 sparkles. Pads use a yaw-only billboard so
they are always readable.

Gentle second chances: after two misses on a `pick` or `pattern` sign, one wrong choice dims to a
quiet grey (`pad.state === 'dim'`, no aim assist, no glow) and "Easier now!" appears; each further
miss removes one more, never below two choices and never the answer. `sequence` and `memory` signs
keep every pad because their order is the puzzle. Leaving the sign (18 m) and returning restores
all choices and the attempts counter.

### Momo's Wisp Market
`src/game/shop.js`. A striped stall at (11, 10) in Sunbeam Meadow, facing the path
to the Star Tree, run by **Momo** — a mossy lantern-snail with a glowing spiral
shell, blinking eyestalks and a coral scarf. It is the only place sparkles are
spent, which gives collecting a point beyond the counter.

Zapping Momo (he is an aim target like a pad, at a 26 m range) opens the market
panel and pauses the world (`state === 'shop'`; Esc or "All done" returns to
play). Three permanent gifts:

| Gift | Price | Effect |
|---|---|---|
| Star Magnet | 40 | `SparkleManager.magnetRange` 4.6 → 9.5 m, pull 2.5 → 3.6 |
| Pip's Bell | 70 | Pip's idle nudge arrives after 3.5 s instead of 9 s |
| Rainbow Blaster | 110 | every zap takes the next sRGB rainbow hue |

Cards carry a picture, a price and Momo's spoken description, and remain
clickable when unaffordable: the card shakes and Momo says how many more
sparkles are needed. Owned gifts turn the card gold, put a badge under the
sparkle counter and swap the stall jar's icon for a star. `purchase()` and
`shopStatus()` are pure functions, so the rules are unit tested without a
browser.

### The Star Tree Workshop
`src/game/workshop.js` + `src/world/ornaments.js`. The second use for sparkles and
the reason to walk every island twice. Six ornaments, one shape each:

| Shape | Where | Colour |
|---|---|---|
| Golden Star | Letterleaf Grove shard | gold |
| Silver Moon | Tallybrook Falls shard | silver |
| Blossom | Pattern Peaks shard | pink |
| Song Bell | Storysong Glade shard | amber |
| Sea Shell | Pebblecount Cove shard | peach |
| Sky Lantern | Momo's market, 90 sparkles | mint |

`shardSpot(zone)` picks a clear ring position from a per-island bearing, keeping
away from the arrival arch, the portals and the sign plinths. Each `ShardField`
beacon is an octahedral crystal in a gold cradle on a stone plinth, with a ground
ring, drifting motes and a 13 m column of light; it chimes once when the player
comes within 16 m and is collected by walking within 2.7 m. The HUD pouch shows
one drawn picture per shape held.

The tree carries two gold garlands at rows y = 3.3 and 4.55; six hooks hang from
them on short cords, each with a dashed outline sprite of its shape. Aiming at a
hook uses the same forgiving 0.24 rad cone as the market, and a zap reaches it
with the blaster's homing bolt. `canPlace()`/`place()` are pure: an ornament must
be held (a world shard or a bought market gift) and can only be hung once; a miss
speaks the shape's name and island and costs nothing. `isComplete()` fires the
payoff: canopy tint, sixteen coloured glows, a warm crown star, a HUD badge, a
Momo + Pip speech chain and a banner. `save.shards` / `save.placed` persist it.

### Hidden discoveries
`src/game/secrets.js` (pure) + `src/world/discoveries.js` (geometry). Thirteen authored hollows across
all six islands reward wandering with no educational objective attached: three in the hub, two in each
themed world. There is no prompt, no marker and no input — walking within 2.1 m is the whole
interaction, because a child who stops exploring can still stumble into one. Placement is data
(`at: { x, z }`, local to the island) and a test keeps every one at least 10 m from the landing path
and 6 m from an island's centre, so nothing sits where a child is already walking. The two cove hollows
(and the cove cairn) are ringed by `buildCoveNook()` — tide pool, wet stones, driftwood, shells,
starfish, dune tufts — so they read as placed corners rather than objects on bare sand.

Each `SecretSpot` is a mossy stone hollow with a gold cradle and one trophy inside (egg, lantern, chime,
book, mushroom, pebble, jar, kite, chart, drum, feather, shell, spyglass), lit by a glow that only
brightens inside 12 m. Finding it pops the object up and away with two particle bursts, `audio.star()`,
a banner, a Pip line spoken aloud, ten sparkles and a companion cheer.

**Where finds live.** Every find is permanent and visible in two places:

- **At home:** the *Discovery Shelf* on the meadow path is a low garden bench holding one keepsake per
  island in a single row, with 13 gems along the front grouped per island that light one by one. The
  HUD chip `#chip-discoveries` carries the total (`N/13`, gold when every gem is lit). No keepsake is
  occluded from 3.3 m, and the bench is low enough not to wall off the meadow.
- **Where you found it:** a `KeepsakeCairn` stands beside each themed island's return portal, with a
  dish and a gem for each secret that island hides.

`save.secrets` stores found ids and is sanitised to known secrets on load; an older save with no
`secrets` key opens at zero without losing anything else.

### The hub grows with the collection
`src/game/hubBloom.js` (pure) turns the saved keepsake list into what the meadow shows, and
`src/world/growth.js` (`HubGrowth`) builds it: one lantern lit per keepsake along the walk-up path,
an island's bunting flag the first time anything is found there, its flower bed blooming when that
island is fully collected, and the **Moonwell Grotto** behind the Star Tree.

The arch is carved stone — plinth, banded shaft, capital, keystone with a star inset, a wall lantern
on each column, ivy and a seamed threshold — and a boulder outcrop closes its back, so it reads as a
place from the walk-up path rather than a gate in a lawn. The grotto is shut until all thirteen are
home: a shimmering veil covers its arch and walking at it stops the child 5.2 m out while Pip says how
many keepsakes would wake it.
**The growth announces itself.** `growthChange(before, after)` in `hubBloom.js` diffs two `hubBloom()`
results, so the words come from the same data as the geometry. When a find grows something, the new
detail gets a warm mote of light, one soft swell of its scale (unless calm motion is on) and a small
rising ribbon of sparkles; `audio.grow(stageIndex)` plays a four-note rise in that stage's key, distinct
from the ordinary pickup; and Pip names what actually grew — one or two things, never a vague "it grew!"
Below thirteen a new stage adds "The far lanterns are still sleeping.", a pointer, not a countdown.
Waking the grotto keeps its own announcement instead of a second one. Resumed saves, reloads and
duplicates never re-announce: only a find that crosses a count celebrates.

**Curious things.** Two per island, from `curios` data: a **leaf drift** that a bolt scatters (and that
gathers itself back in 22 s), a **sun crystal** that rings to a bolt and regrows in 18 s, and a
**listening stone** that opens to the existing patient gaze (0.7 s within 4.6 m) and speaks one true
nature fact. Each pays a few sparkles the first time per session and nothing after, so nothing can be
farmed. They are scenery first: no prompt, no marker, no failure state, and a curio is only chosen as a
zap target when no sign, creature, hook or Momo stands in front of it.
 At 13/13 the veil parts, stepping stones appear, and the grotto holds a
moonwell with rim stones and lily pads, two crystals, fireflies, ferns, mushrooms, a stone bench and a
banded chest on a cut stone footing. Walking to the chest gives 30 sparkles, a banner, a burst and a
Pip line, stored as `save.grotto` (only a literal `true` reopens it after a reload).

Growth is staged rather than all-or-nothing, so the meadow keeps changing between the first find and
the last: a worn stone path is laid two keepsakes at a time (seven flagstones), a bunting swag above
the planters gains one pennant per keepsake, each planter's five stems fill as its own island is
explored and glow only when that island is complete, the moonwell's nine rim stones wake from the
fifth keepsake on, the five stepping stones rise over the last five, four fireflies drift to the arch,
and the veil thins and brightens without ever parting until thirteen.

Everything is derived from `sanitizeSecrets(save.secrets)`, so a save with missing, partial, unknown
or malformed ids simply grows less: no throw, no wiped save, and no display that needs keys the save
does not have.

### Tools — the Starbolt and the Leafwhisk
Two tools live in the child's hands; `src/game/tools.js` owns the switch and the intake's rules, and a
HUD chip (`#chip-tool`) names the active one.

- **Starbolt** — the original blaster: bolts to signs, creatures, hooks, Momo and curios, with snap aim
  to whatever is nearest the reticle.
- **Leafwhisk** — the vacuum, and a whole-game verb since iteration 22. Four families of authored
  loose scenery are gatherable: **leaf** drifts (hub), **petal** windflower patches (grove, and one in
  the falls), **dust** vents (falls, peaks) and **glow-mote** perches (words, cove). Hold the trigger
  with one inside the wide intake cone (7.5 m, `cos 0.88`, anything within 1.2 m of the mouth always
  counts) and its loose part lifts off along a curve into the glowing nozzle, shrinking and spinning as
  it goes. Petals flutter, dust plumes rise and flurries spin, motes orbit and their sea glass dims.
  The prop shrinks as it empties, the whoosh (`suckStart`/`suckSet`/`suckStop`) and the cone rise with
  the load, and the finishing move pops a family-specific bundle with `audio.pop`: a ribboned petal
  posy, a golden dust puff, a tiny mote lantern, or the leaf bundle.
- **The hello:** `familyReward(type, greeted)` pays one small hello per family per session (3 for
  leaf/petal/mote, 2 for dust) plus Pip's line; later gathers of that family pay nothing and say
  nothing, but always work, always pop a bundle and always toast. Each prop keeps a permanent base
  (stems, stone collar, perch) and shows a remnant once gathered; each regrows by itself (leaf 22 s,
  petal 20 s, dust 24 s, mote 26 s). Nothing is lost, timed or gated.
- **Switch:** `Q` (keyboard), right mouse button, the 🌀 touch button, or **B** on a gamepad. Switching
  never blocks movement, jumping or pausing. The first switch in a session is taught out loud.
- **Calm motion** removes the whisk's bob and sway and straightens every debris path to the mouth.

### Pip's garden

The Leafwhisk's bundles are spent in one place: Pip's garden, a small authored bed on the meadow
path at (-10.5, 14) facing the lantern row (`GARDEN` in `src/content.js`). It is optional scenery, not
a gate: nothing in the story or in a sign needs it, nothing is charged for visiting, and a child who
never goes there loses only the garden.

Three spots, one per family, each accepting `GIFT_MAX` (3) gifts:

- **Posy bed** (petal) — three clusters of three blooms, always dressed with waiting shoots; a
  butterfly arrives with the first gift and stays.
- **Sun bowl** (dust) — six coals that warm and a rising glow, three flames from the second gift, and
  drifting embers.
- **Lantern post** (mote) — three lanterns hang unlit from the first frame; each mote lantern lights
  one, and four motes gather above the post once all three are lit.

Giving uses the existing bolt verb: aim at a spot (a forgiving 0.2 rad inside 6.5 m) and zap. The
rules are pure in `src/game/gifts.js` — `giveGift(bundles, gifts, kind)` returns fresh objects plus an
`ok` flag and, on refusal, `reason: 'full' | 'empty'`. A refusal costs nothing, plays no sound and
draws no particles; only Pip's spoken line explains it. Once every spot is full the gift goes to the
Moon Arbor instead (below), so the refusal path only appears for an empty basket. A success spends exactly one bundle, plays
`audio.give(kind)` (a distinct sound per family), toasts, speaks one of three per-stage lines, grows
the spot, and saves immediately.

The basket (`game.bundles`, `#chip-bundles`) stocks only the three gift families; the hub's leaf drift
stays a pure celebration with no basket entry. It hides while empty, and the first bundle of a session
gets one spoken pointer to the garden 2.1 s after the gather line, so no sign or marker is needed. Both
`bundles` and `gifts` live in the v1 save and are sanitised on load (`BASKET_MAX` 9, `GIFT_MAX` 3), so
older saves boot with an empty basket and an empty garden.

Everything here obeys calm motion: with reduced motion the butterfly rests, the flames disappear
(the bowl keeps its steady glow and coals), the embers hold still, and the motes stop orbiting. The
setting is read every frame, so it also settles a garden that is already warm.

### The Moon Arbor (overflow)

Behind the bed stands a second authored structure from the first visit: two vine-clad posts, a low
arch and six paper lanterns that hang dark, with a dim moon bead at the centre. It is what the garden
grows into, and it exists so a bundle is never spare.

Once `allSpotsFull(gifts)` is true, `_giveGift` stops looking at which spot was zapped and hands the
gift to the arbor instead, choosing whichever family the basket actually holds. `giveArbor` in
`src/game/gifts.js` is the rule set:

- Each of the first `ARBOR_MAX` (6) gifts hangs one lantern. The sixth reports `woke`: `audio.arbor()`
  plays (instead of the family chime), the toast is "The Moon Arbor is awake!", and a moon moth moves
  in under the arch and stays.
- Every gift after that is a wish: `audio.wish()`, a wish toast and one phase line, and one more
  firefly around the arbor up to `WISH_MAX` (12). The fireflies cap so the constellation stays
  legible, but the wishes never do — `wishCount` sanitises to `WISH_CAP` (999) only so a wild save
  cannot overflow.
- Each wish also turns the moon one step through `MOON_PHASES`: full, waning, half, crescent, new, then
  round again. The moon is a sphere lit by a shader from `phase.angle` in the camera's frame, so the
  lit hemisphere *is* the carved shape with a soft terminator and a faint rim: at `angle` 0 the whole
  face is bright, at pi/2 exactly half, at 1.95 a clear crescent, at 3.05 a dark disc. `phaseLight()`
  turns the angle into the light vector and the lit fraction; `glow` colours the lit face and halo
  (cream, gold, amber, rose, blue), `bright` is the shader gain, `lamp` warms the lanterns a shade, and
  `scale` only nudges the size. The fireflies, the six lights and the moth stay exactly as they were, so
  the place stays readable while the sky keeps changing. There is no counter in the HUD, no refusal for
  being full, and nothing is lost by ignoring it.
- An empty basket is the only refusal, and it answers with `ARBOR_EMPTY` (which families count) and
  nothing else — no sound, no particles, nothing spent. `Hud.toast` refreshes a repeated line rather
  than stacking identical cards, so quick wishes do not build a wall of toasts.
- The last spot filling speaks `ARBOR_HINT` once, 2.2 s after that gift's own line, so the arbor is
  discovered by doing what a child already does.

`save.arbor` (0–6) and `save.wishes` (0–`WISH_CAP`) are sanitised on load and default to zero, so a
legacy save wakes to a sleeping arbor and a full moon. The shader never animates the shape: the light vector
only changes when a wish arrives, so `reducedMotion()` has nothing to still. Under `reducedMotion()` the lantern glow is steady, the moth holds a
fixed hover with its wings open and the fireflies stop orbiting.

### Controls on every device
`src/engine/input.js` is the single source of movement, look and zapping; `src/game/controls.js` is the
single source of what each device is *called* on screen.

| Action | Keyboard | Mouse | Touch | Gamepad |
|---|---|---|---|---|
| Walk | W A S D / arrows | W A S D | thumb pad | left stick |
| Look | arrow keys | mouse | drag the world | right stick |
| Zap (hold to gather) | E / Enter | click | Zap button | RT or X |
| Switch tool | Q | right-click | 🌀 button | B |
| Jump | space | space | Jump button | A |
| Pause | Escape | Escape | Continue button | Start |
| Say it again | R | R | repeat button | Y |

The HUD legend chip (`#chip-controls`) always names the device used most recently — moving the mouse
hands it back to mouse, touching the screen to touch, and so on — and the repeat-key hint is hidden
where there is no key. The touch pad only appears on a touchscreen.

### Learning progress & adaptive difficulty
`src/game/progress.js` (pure) + `src/ui/progressPanel.js` (pause screen). Five subjects —
letters/sounds, words/rhymes, numbers/counting, patterns/shapes, memory/listening — are tallied
independently from the signs a child actually solves: `attempts`, first-try solves and misses.

`subjectOfStation()` files a sign by its `learn` label first, then its type (`memory`, `pattern`),
then its pad kinds, then its island, so nothing is ever unsorted. `levelFor()` returns Gentle, Just
right or Stretch for one subject: auto needs two solved signs to go Gentle (first-try rate ≤ 0.4) and
three to go Stretch (≥ 0.8); an explicit grown-up setting always wins. The level feeds `narrowAfter()`
(1 / 2 / 3 misses before a wrong choice fades) and `hintDelay()` (1.9 / 2.7 / 3.6 s). Rewards never
change with the level, so help is not a penalty.

The pause screen's **grown-up corner** shows one row per subject (`N signs · M first try`) and an
Auto/Gentle/Stretch button that saves immediately — the only place difficulty is set, and always per
subject. `save.learning` and `save.difficulty` hold both, sanitised on load.

### Content format (`src/content.js`)
Zones, portals, stations, pads, creatures and all spoken text are data. Pad kinds: `letter`
(optional `marker` picture card), `number` (numeral + dot row), `word`, `dots`, `shape`, `icon`
(picture plate), `group` (N emoji on a plate), `sum`, `take`, `mystery`.

### Progression
`ZONE_STAR_ORDER` drives everything: HUD star slots, Wish Tree sockets (`SOCKET_COUNT` loop in
`props.js`), berry totals, ending stats, pause text. Solving every sign on an island spawns its
Starberry; collecting it lights a socket. The ending fires only at `ZONE_STAR_ORDER.length` stars
within 9 m of the tree, then "Keep exploring" returns to play.

### Companion
`src/game/companion.js`. Procedural firefly-bird: cream body, gold wings, big eyes, crest, star tail,
soft glow sprites. Follows at a damped offset, flaps faster while moving, spins and sparks on
`solve`, squints/dips on `wrong`, floats toward a sign on `pointAt`.

### Save
`src/engine/save.js`, key `starlight-hollow-save-v1`: sparkles, stars, solved station ids, scanned
creature keys, visited zones, owned market gifts (`upgrades`), ended flag. Restores solved stations, socket lights, creature
friendships and any finished-but-uncollected island berry. New checkpoints resume at the current island’s safe spawn. Legacy saves without a zone start in the meadow. A previous local checkpoint backs up unreadable JSON; malformed fields are normalized. Pending pickups flush on pause or page exit when the browser allows it.

### Doors that ask for a tool

Two of the thirteen hidden hollows are not a walk-in. Both are built from the same scenery language as
their island, and both name their tool out loud the first time a child walks up:

- **The sleepy drift** (Letterleaf Grove, the storybook). Two bent boughs, a woven arch, a mossy mound
  and a curtain of leaves with a few already turned warm. Holding the Leafwhisk at it sips the leaves
  away into the whisk; the curtain thins as it goes, so a child who stops halfway sees progress and can
  come back.
- **The frost bell** (Pattern Peaks, the star chart). Two frosted stones and a lintel with a crystal
  hanging from a gold band, and a veil of soft frost between them. One bolt rings the bell; the veil
  melts and the doorway is open.

The rules are pure data: each gate sits 2.1–4.5 m in front of its hollow, names its `kind`, its `at`
offset and the one line Pip says when it opens. While a door is shut the hollow behind it is hidden
(the little object, its glow and its marker), so the door is the only thing to look at. Opening is
one-way and saved: `gates` is a sanitised list of ids, a legacy save opens every door shut, and
revisiting an opened door is silent. There is no counter, no toast, no reward gate and no way to fail:
walking away mid-sip only leaves the curtain thinner for next time.

## 5. Presentation

- **Art**: low-poly rounded primitives, flat-ish palettes per island, additive glow sprites, no
  textures except canvas-generated glyph plates. Palettes in each zone's `palette` block.
- **Signs**: 256 px canvas glyphs (`src/world/textures.js`) drawn with Fredoka; letters/numbers get a
  cream + ink outline; icons get a warm round picture plate; arithmetic uses vector +/− symbols.
- **Audio**: fully synthesised (`src/engine/audio.js`) — per-zone generative melodies, zaps, chimes,
  praise, soft wrong-answer tones, footsteps. Voice is the Web Speech API (`src/engine/voice.js`);
  every bubble can be replayed with the 🔁 button.
- **HUD**: star chips, sparkle counter, zone chip, goal chip, speech bubble, feedback flash, toasts,
  banner, hint, crosshair that warms when something is aimable.

## 6. Controls & accessibility

WASD/arrows to walk, mouse to look (pointer lock, with drag fallback), Space to jump, click to zap,
Q (or right-click) to switch between the Starbolt and the Leafwhisk, hold zap to gather leaves, R or
the repeat button to hear the nearby sign again, Esc to pause, M to mute. Movement is forgiving: coyote time, jump buffering, a soft magical edge
instead of falling off, and aim assist that snaps to the pad nearest the reticle.

Accessibility in place: all instructions voiced and repeatable, picture-first pads, forgiving
interaction ranges, colour-independent pad states (ring shape/scale + flash), reduced camera motion
(subtle bob), pause on blur, and a **Calm motion** switch on the pause screen beside Sound. Calm motion
follows the device's `prefers-reduced-motion` setting until a grown-up chooses otherwise; it removes the
hub flourish's scale swell and sparkle burst (leaving a light mote), stills the Leafwhisk and makes
its debris fly straight, and is remembered across sessions (`starlight-hollow-calm-motion`).

## 7. Technology

Three.js with Vite 5, vanilla ES modules, no UI framework. The Windows release uses Electron and
electron-builder. Deterministic procedural world generation (seeded `mulberry32`) keeps the game
small. The Fredoka font is bundled; the Windows app blocks HTTP(S) requests during play. Spoken
instructions use the operating system's Web Speech service and require a local English voice for
offline narration.

Performance approach: one island visible at a time by distance culling (`_updateVisibility`),
frustum culling, sprite-based glows, shared geometries within a station, `pixelRatio` capped at 2.

## 8. Assets & licensing

- **Three.js** — MIT.
- **Fredoka** font — SIL Open Font License, bundled through `@fontsource-variable/fredoka`.
- All geometry, textures, glyph plates, particle effects, music and sound effects are generated at
  runtime by this project's own code. No third-party art, audio or characters are used.
- The design is inspired by the *feel* of family adventure games (exploration, collecting, friendly
  creatures). No characters, names, art or story beats are copied from any existing game.

## 8b. Lantern Hollow

The meadow's sixth place is not a menu and not a prize: it is a walk. An arch on the west edge sleeps
under bramble until the arbor grants one real wish; then it lights and stays lit in every save after
that. Nothing inside is graded - no signs, no stations, no counters - so the only reason to go is the
place: a dusk pond with moonpetals and an islet lantern tree, a six-lantern stone walk, a stream on
stepping stones, moths in the warm light, and two things tucked away (a Moon Moth Lantern you can walk
straight past, a Ferny Music Box behind ferns the Leafwhisk clears). Prizes here are saved separately
from the thirteen keepsakes, so the shelf, the cairns, the grotto and the hub's growth are untouched.

## 9. Known gaps (next priorities)

0. A use for what the Leafwhisk gathers (a dye, a gift for Momo, a lantern to hang) — gathering is a
   whole-game verb now that every themed world has its own family, but the bundles are still only a
   celebration. Also: no touch or pad hardware has been tried, and there is no Windows build yet.
1. A second sparkle sink (decorating the Star Tree) and a care loop for Momo, so saving
   continues after all three gifts are bought.
2. Parent dashboard and a grown-up progress corner (per-subject stats, profile settings).
3. Telling-time curriculum (no clock activity yet).
4. Touch controls for Android; split-screen/local co-op; sandbox mode.
5. Per-subject adaptive practice beyond the per-sign choice narrowing introduced in iteration 9, and a
   second purpose for the Leafwhisk beyond gathering leaf drifts.
6. Finish the two-pattern wrong/correct input capture; verify the filled blank after reloading.
7. A human Windows playtest of the current beta (both editions, narration offline, save/reopen,
   installer shortcut, uninstall).
