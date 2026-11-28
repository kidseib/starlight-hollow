# Roadmap

Ordered by how much it helps a five-to-seven-year-old play on their own. Updated at the end of
every development iteration; `docs/GAME_DESIGN.md` tracks the current design.

## Now (next two iterations)

1. **A real-device pass** — touch and gamepad were proved with emulated pointer events and an injected
   pad; nothing has run on an Android phone or a physical controller, and no Windows build was made.
2. **Scale up the small keepsakes** — the pebble and the shell read smaller than the egg and drum on
   the bench; a per-trophy display scale would even the row out.
3. **Secrets that use the gadgets** — every find is a walk-in today; two or three could sit behind a
   vacuum-able leaf pile or a blast-able crystal so the gadgets have a reason to be pointed at
   scenery.
2. **Grown-up corner follow-ups** — it now shows per-subject tallies and difficulty buttons; next
   comes a short list of the signs last met, so a parent can see *what* was hard, not just how many.
3. **Star Tree follow-ups** - a second ornament set and a small "which shape is
   missing?" sign, so the workshop keeps giving after the first tree is full.
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
