# Roadmap

Ordered by how much it helps a five-to-seven-year-old play on their own. Updated at the end of
every development iteration; `docs/GAME_DESIGN.md` tracks the current design.

## Now (next two iterations)

1. **A mid-collection growth step** — lanterns, flags, beds and the grotto are the first pass; a path
   that visibly widens or a bridge that appears around 7/13 would make halfway feel different again.
2. **Signs that use the gadgets** — a vacuum-able leaf pile, a blast-able crystal and a scanner-only
   landmark would give the tools scenery to point at instead of only floating signs.
3. **Secrets behind a small puzzle** — every find is still a walk-in; two could sit behind a
   vacuum-able leaf pile or a blast-able crystal so exploration and gadgets meet.
4. **A real-device pass** — touch and gamepad were proved with emulated pointer events and an injected
   pad; nothing has run on an Android phone or a physical controller, and no Windows build was made.
5. **Grown-up corner follow-ups** — it shows per-subject tallies and difficulty buttons; next comes a
   short list of the signs last met, so a parent can see *what* was hard, not just how many.
6. **A real Windows playtest of the current beta** — both editions, narration with the network off,
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
