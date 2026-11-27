# Changelog

Every public Windows beta, newest first. Player-facing changes only; the development detail lives in
`DEVELOPMENT_LOG.md` and `docs/ITERATIONS.md`.

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
