# Roadmap

Ordered by how much it helps a five-to-seven-year-old play on their own. Updated at the end of
every development iteration; `docs/GAME_DESIGN.md` tracks the current design.

## Now (next two iterations)

1. **Secrets behind a small puzzle** — every find is still a walk-in; two could sit behind a leaf
   drift you scatter or a crystal you ring, so exploration and the reacting scenery meet.
2. **A vacuum gadget of its own** — the hollow's verbs are a bolt and a patient gaze; a real vacuum
   would need a tool switch on all four devices, a first-person model and its own legend, so it is a
   whole iteration rather than a prop.
3. **A grotto veil that reads as fabric** — it is a glow and a translucent sheet today; woven ribbons
   or drifting motes in the arch would sell "asleep" better.
4. **A keepsake worth finding further out** — the meadow's three are close to the path; one grove or
   peaks find could need a jump or a gadget so the last keepsake feels like a journey.
5. **A real-device pass** — touch and gamepad were proved with emulated pointer events and an injected
   pad; nothing has run on an Android phone or a physical controller, and no Windows build was made.
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
11. Accessibility pass: caption size, colour-blind-safe pad palettes (reduced motion now exists).

## Known issues

- The Windows beta is unsigned; SmartScreen warns on first launch.
- Speech depends on an installed English OS voice; subtitles are the fallback.
- Cloud browser software rendering runs at roughly 4 fps, so timing-sensitive checks need polling
  rather than fixed waits.
