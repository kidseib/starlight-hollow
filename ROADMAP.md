# Roadmap

Ordered by how much it helps a five-to-seven-year-old play on their own. Updated at the end of
every development iteration; `docs/GAME_DESIGN.md` tracks the current design.

## Now (next two iterations)

1. **Secrets behind a small puzzle** — every find is still a walk-in; two could sit behind a leaf
   drift you scatter or a crystal you ring, so exploration and the reacting scenery meet. The
   Leafwhisk now gives the drifts a second verb, so a vacuum-only nook is possible too.
2. **A grotto veil that reads as fabric** — it is a glow and a translucent sheet today; woven ribbons
   or drifting motes in the arch would sell "asleep" better.
3. **A keepsake worth finding further out** — the meadow's three are close to the path; one grove or
   peaks find could need a jump or a gadget so the last keepsake feels like a journey.
4. **A second use for the Leafwhisk beyond leaves** — dust puffs and petals already react; petals
   could be gathered into a dye or a gift for Momo's stall, giving the tool a small purpose.
5. **A real-device pass** — touch and gamepad were proved with emulated pointer events and an injected
   pad; nothing has run on an Android phone or a physical controller, and no Windows build was made.
6. **A real Windows playtest of the current beta** — both editions, narration with the network off,
   save and reopen, installer shortcut, uninstall.

## Next

7. **Telling-time activity** for a sixth island: an analogue clock face with a spoken time.
8. **Touch controls** (drag to look, on-screen stick) so the same build works on Android tablets.
9. **Per-subject adaptive practice**: the per-sign choice narrowing now exists; extend the idea to
   choosing which signs a child meets first based on earlier misses.
10. **A care loop for Momo** — a small daily errand for the marketkeeper, so the stall feels
   alive between purchases.

## Later

11. Local split-screen co-op.
12. Parent profile settings and difficulty overrides.
13. Accessibility pass: caption size, colour-blind-safe pad palettes (reduced motion now exists).

## Known issues

- The Windows beta is unsigned; SmartScreen warns on first launch.
- Speech depends on an installed English OS voice; subtitles are the fallback.
- Cloud browser software rendering runs at roughly 4 fps, so timing-sensitive checks need polling
  rather than fixed waits.
