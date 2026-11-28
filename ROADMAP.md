# Roadmap

Ordered by how much it helps a five-to-seven-year-old play on their own. Updated at the end of
every development iteration; `docs/GAME_DESIGN.md` tracks the current design.

## Now (next two iterations)

1. **A use for what the whisk gathers** — bundles are celebration today; one could become a dye, a
   gift for Momo or a lantern for the grotto, so gathering feeds the rest of the game.
2. **Secrets behind a small puzzle** — every find is still a walk-in; two could sit behind a leaf
   drift you scatter or a crystal you ring, so exploration and the reacting scenery meet. The
   Leafwhisk now gives the drifts a second verb, so a vacuum-only nook is possible too.
3. **A grotto veil that reads as fabric** — it is a glow and a translucent sheet today; woven ribbons
   or drifting motes in the arch would sell "asleep" better.
4. **A keepsake worth finding further out** — the meadow's three are close to the path; one grove or
   peaks find could need a jump or a gadget so the last keepsake feels like a journey.
5. ~~**A second use for the Leafwhisk beyond leaves**~~ — done in iteration 22: petals, dust and glow
   motes are authored, gatherable scenery in every themed world, each with its own bundle and its own
   once-a-session hello.
6. **A real-device pass** — touch and gamepad were proved with emulated pointer events and an injected
   pad; nothing has run on an Android phone or a physical controller, and no Windows build was made.
7. **A real Windows playtest of the current beta** — both editions, narration with the network off,
   save and reopen, installer shortcut, uninstall.

## Next

8. **Telling-time activity** for a sixth island: an analogue clock face with a spoken time.
9. **Touch controls** (drag to look, on-screen stick) so the same build works on Android tablets.
10. **Per-subject adaptive practice**: the per-sign choice narrowing now exists; extend the idea to
    choosing which signs a child meets first based on earlier misses.
11. **A care loop for Momo** — a small daily errand for the marketkeeper, so the stall feels alive
    between purchases.

## Later

12. Local split-screen co-op.
13. Parent profile settings and difficulty overrides.
14. Accessibility pass: caption size, colour-blind-safe pad palettes (reduced motion now exists).

## Known issues

- The Windows beta is unsigned; SmartScreen warns on first launch.
- Speech depends on an installed English OS voice; subtitles are the fallback.
- The Leafwhisk has no purpose beyond sparkles and the bundle pop yet; the three new families made that
  more visible rather than less.
- Cloud browser software rendering runs at roughly 4 fps, so timing-sensitive checks need polling
  rather than fixed waits.
