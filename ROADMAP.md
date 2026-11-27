# Roadmap

Ordered by how much it helps a five-to-seven-year-old play on their own. Updated at the end of
every development iteration; `docs/GAME_DESIGN.md` tracks the current design.

## Now (next two iterations)

1. **Finish the in-browser evidence for pattern signs** — wrong answer, correct answer, filled
   blank after reload, before/after screenshots. Carried over from iteration 6.
2. **A grown-up corner on the pause screen** — what has been learned (letters, numbers, patterns,
   memory), so a parent can see progress without a dashboard.
3. **A second sparkle sink: decorate the Star Tree** - the market gives sparkles
   three uses; a small decoration shop keeps saving worthwhile afterwards.
4. **A real Windows playtest of the current beta** — both editions, narration with the network off,
   save and reopen, installer shortcut, uninstall.

## Next

5. **Telling-time activity** for a sixth island: an analogue clock face with a spoken time.
6. **Touch controls** (drag to look, on-screen stick) so the same build works on Android tablets.
7. **Per-subject adaptive practice**: the per-sign choice narrowing now exists; extend the idea to
   choosing which signs a child meets first based on earlier misses.
8. **A care loop for Momo** — a small daily errand for the marketkeeper, so the stall feels
   alive between purchases.

## Later

9. Local split-screen co-op.
10. Parent profile settings and difficulty overrides.
11. Accessibility pass: caption size, colour-blind-safe pad palettes, reduced motion.

## Known issues

- The Windows beta is unsigned; SmartScreen warns on first launch.
- Speech depends on an installed English OS voice; subtitles are the fallback.
- Cloud browser software rendering runs at roughly 4 fps, so timing-sensitive checks need polling
  rather than fixed waits.
