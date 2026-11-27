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
- **Momo** — a mossy lantern-snail who runs the market in the meadow in a striped-awning stall.
  Blinks, breathes, hops when greeted, shakes his head when a gift is too expensive.
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

The meadow holds five arches (plaque + icon + glowing veil), one per island, plus Momo's stall at
(11, 10) on the path to the tree. Islands are 420 units apart on the X axis so only one is in the
frustum at a time.

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
browser. The market's spot lives in a `MARKET` constant in `game.js` rather
than in `content.js`, because it is one fixed stall, not zone content.

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
`solve`, squints/dips on `wrong`, floats toward a sign on `pointAt`. Pip's Bell shortens its idle wait.

### Save
`src/engine/save.js`, key `starlight-hollow-save-v1`: sparkles, stars, solved station ids, scanned
creature keys, visited zones, owned market gifts (`upgrades`), ended flag. Restores solved stations, socket lights, creature
friendships, bought gifts and any finished-but-uncollected island berry. New checkpoints resume at the current island’s safe spawn. Legacy saves without a zone start in the meadow. A previous local checkpoint backs up unreadable JSON; malformed fields are normalized. Pending pickups flush on pause or page exit when the browser allows it.

## 5. Presentation

- **Art**: low-poly rounded primitives, flat-ish palettes per island, additive glow sprites, no
  textures except canvas-generated glyph plates plus the hand-drawn market sign and jar labels.
  Palettes in each zone's `palette` block. The Star Tree altar is carved: mossy footing, 12-sided
  stone drum, gold band, lit top slab and five rune octahedrons.
- **Signs**: 256 px canvas glyphs (`src/world/textures.js`) drawn with Fredoka; letters/numbers get a
  cream + ink outline; icons get a warm round picture plate; arithmetic uses vector +/− symbols.
- **Audio**: fully synthesised (`src/engine/audio.js`) — per-zone generative melodies, zaps, chimes,
  praise, soft wrong-answer tones, footsteps. Voice is the Web Speech API (`src/engine/voice.js`);
  every bubble can be replayed with the 🔁 button.
- **HUD**: star chips, sparkle counter with gift badges, zone chip, goal chip, speech bubble, feedback
  flash, toasts, banner, hint, market panel, crosshair that warms when something is aimable.

## 6. Controls & accessibility

WASD/arrows to walk, mouse to look (pointer lock, with drag fallback), Space to jump, click to zap,
R or the repeat button to hear the nearby sign again, Esc to pause (or close the market), M to mute. Movement is forgiving: coyote time, jump buffering, a soft magical edge
instead of falling off, and aim assist that snaps to the pad nearest the reticle.

Accessibility in place: all instructions voiced and repeatable, picture-first pads and market cards,
forgiving interaction ranges, colour-independent pad states (ring shape/scale + flash), reduced
camera motion (subtle bob), pause on blur.

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

## 9. Known gaps (next priorities)

1. A second sparkle sink (decorating the Star Tree) and a care loop for Momo, so saving
   continues after all three gifts are bought.
2. Parent dashboard and a grown-up progress corner (per-subject stats, profile settings).
3. Telling-time curriculum (no clock activity yet).
4. Touch controls for Android; split-screen/local co-op; sandbox mode.
5. Per-subject adaptive practice beyond the per-sign choice narrowing introduced in iteration 9.
6. Finish the two-pattern wrong/correct input capture; verify the filled blank after reloading.
7. A human Windows playtest of the current beta (both editions, narration offline, save/reopen,
   installer shortcut, uninstall).
