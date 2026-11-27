# Changelog

Every public Windows beta, newest first. Player-facing changes only; the development detail lives in
`DEVELOPMENT_LOG.md` and `docs/ITERATIONS.md`.

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
