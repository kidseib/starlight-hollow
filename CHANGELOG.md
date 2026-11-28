# Changelog

Every public Windows beta, newest first. Player-facing changes only; the development detail lives in
`DEVELOPMENT_LOG.md` and `docs/ITERATIONS.md`.

## 0.1.4-beta.1 — 2026-11-27

**The Star Tree Workshop.** The Star Tree is now something to build, and sparkles
have a second job. Five glowing star shards are hidden on the five adventure
islands — a golden star in Letterleaf Grove, a silver moon in Tallybrook Falls, a
pink blossom on Pattern Peaks, a song bell in Storysong Glade and a sea shell in
Pebblecount Cove. Each sits on a little stone plinth, ringed with light, under a
tall beam you can spot from across the island, and each sings a soft chime as you
come close. Walk into one to pop it in your pouch.

The pouch shows every shape as a picture under the sparkle counter. At the Star
Tree, two gold garlands now wrap the trunk with six hooks, each carrying a dashed
outline of the ornament that belongs there. Zap the outline that matches a shape
you are carrying: the ornament pops onto the branch with a bounce and a happy
line, and it is still there when you come back tomorrow. The sixth shape, a **Sky
Lantern**, is sold by Momo for 90 sparkles, so the market and the tree feed each
other.

Hang all six and the tree changes for good: the leaves turn a luminous
mint-gold, a garland of coloured lights gathers round the canopy and a warm star
glows above it. A new gold badge appears beside your shards, Pip and Momo both
say thank you, and the goal chip reads "The Star Tree is decorated" so you can
stand and admire it.

- Ornaments are modelled from the same shape painter that draws the pouch
  pictures, so a shard, its outline and the finished ornament all read as one
  object.
- For grown-ups: shards and placements live in the existing v1 save (`shards`,
  `placed`); saves from earlier betas open with an empty pouch. Zapping the wrong
  outline costs nothing — the game names the shape and the island where it hides.
- Art pass: drawn market icons for every gift (no emoji cards), the stall counter
  widened for four jars, a calmer shard beacon, and a two-by-two market grid.

Verified with 26 tests (9 new for the workshop), a clean production build, and the
whole loop played in the cloud browser: every shard collected, the Sky Lantern
bought from Momo, all six ornaments hung by zapping the tree, the decorated tree
and badge reached, and the result still there after a reload. A Windows playtest
is still outstanding.

## 0.1.3-beta.1 - 2026-11-27

**Momo's Wisp Market.** Sparkles finally have somewhere to go. Momo, a mossy
lantern-snail with a glowing spiral shell, keeps a striped stall beside the path
to the Star Tree in Sunbeam Meadow. Zap Momo to open the market.

- Three permanent gifts: **Star Magnet** (40 sparkles) pulls loose sparkles from
  much further away, **Pip's Bell** (70) makes Pip point out the next sign after
  four seconds instead of nine, and **Rainbow Blaster** (110) gives every zap the
  next colour of the rainbow.
- Cards show a picture, a price and Momo's spoken description, so a child who
  cannot read can shop by icon alone. Trying to buy with too few sparkles shakes
  the card and Momo says how many more are needed; nothing is ever lost.
- Bought gifts appear as gold badges under the sparkle counter and as stars in
  the stall jars, and they are saved with the rest of the adventure.
- Art pass: new Momo character (body, eyestalks, glowing shell, scarf), the
  striped-awning stall with glass jars and hanging lanterns, hand-drawn market
  and jar icons, and the hub altar rebuilt with moss, a gold band and five rune
  lights.

Verified with 17 tests (8 new for the market), a clean production build, and the
whole loop played in the cloud browser: walk up, zap Momo, be refused kindly,
buy all three gifts, feel the magnet pull, save and reload. A Windows playtest
is still outstanding.

## 0.1.2-beta.1 — 2026-11-27

**Smaller questions, clearer paths.**

- **Gentler second chances.** After two wrong answers at a picture or pattern sign, one wrong choice
  fades to a quiet grey and "Easier now!" appears, leaving the right answer and one friendlier
  choice. Each further miss removes one more, never below two choices and never the answer. The
  spoken hint still arrives on its own. Walking away and coming back restores every choice, so a
  fresh attempt is never already simplified. Order and memory signs keep all their pads, because
  their order is the puzzle.
- **Finished islands are marked.** An arch in Sunbeam Meadow now wears a small star once that
  island's Starberry is safely in the tree, and its beacon fades, so a child can see at a glance
  which paths still have work to do.
- New regression tests cover the narrowing rules, and the Windows workflow builds from a release
  tag passed as an input.

## 0.1.1-beta.1 — 2026-11-27

- **Repeat controls.** Press **R** or click the repeat button to hear the nearest sign again without
  releasing mouse look. Leaving an unsolved sign clears only that sign's prompt, never newer
  dialogue. Memory signs replay their lights and start a fresh copy round; extra presses during the
  demo do not queue another round.
- Save handling: pending sparkles are flushed on pause or exit, a previous checkpoint is kept, and
  malformed saves no longer break startup.

## 0.1.0 — 2026-11-27

- First public Windows beta: five floating islands, 29 learning signs, Pip the companion, friendly
  creatures, sparkles, Starberries, and the Star Tree ending. Portable EXE and per-user installer.
