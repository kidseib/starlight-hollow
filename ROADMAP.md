# Roadmap

Ordered by how much it helps a five-to-seven-year-old play on their own. Updated at the end of
every development iteration; `docs/GAME_DESIGN.md` tracks the current design.

## Now (next two iterations)

1. **A second thing to spend bundles on** — Pip's garden takes nine gifts and is meant to fill; after
   that the basket has nowhere to go. A small repeatable use (a birdbath that fills, a window box at
   the market, bundles for Momo) would keep later gatherings worth doing without gating anything.
2. **Secrets behind a small puzzle** — every find is still a walk-in; two could sit behind a leaf
   drift you scatter or a crystal you ring, so exploration and the reacting scenery meet. The
   Leafwhisk now gives the drifts a second verb, so a vacuum-only nook is possible too.
3. **A grotto veil that reads as fabric** — it is a glow and a translucent sheet today; woven ribbons
   or drifting motes in the arch would sell "asleep" better.
4. **A keepsake worth finding further out** — the meadow's three are close to the path; one grove or
   peaks find could need a jump or a gadget so the last keepsake feels like a journey.
5. ~~**A use for what the whisk gathers**~~ — done in iteration 23: petals, sun puffs and mote lanterns
   each grow their own spot in Pip's garden on the meadow path.
6. ~~**A second use for the Leafwhisk beyond leaves**~~ — done in iteration 22: petals, dust and glow
   motes are authored, gatherable scenery in every themed world, each with its own bundle and its own
   once-a-session hello.
7. **A real-device pass** — touch and gamepad were proved with emulated pointer events and an injected
   pad; nothing has run on an Android phone or a physical controller, and no Windows build was made.
8. **A real Windows playtest of the current beta** — both editions, narration with the network off,
   save and reopen, installer shortcut, uninstall.

## Next

9. **Telling-time activity** for a sixth island: an analogue clock face with a spoken time.
10. **Per-subject adaptive practice**: the per-sign choice narrowing now exists; extend the idea to
    choosing which signs a child meets first based on earlier misses.
11. **A care loop for Momo** — a small daily errand for the marketkeeper, so the stall feels alive
    between purchases.
12. ~~**Touch controls**~~ — done: thumb stick, drag-look, and zap/tool/jump/pause buttons, proved with
    emulated touch.

## Later

13. Local split-screen co-op.
14. Parent profile settings and difficulty overrides.
15. Accessibility pass: caption size, colour-blind-safe pad palettes (reduced motion now exists).

## Known issues

- The Windows beta is unsigned; SmartScreen warns on first launch.
- Speech depends on an installed English OS voice; subtitles are the fallback.
- Pip's garden is finite (three gifts per spot) and exists only in the meadow; once every spot is full,
  a gathered bundle has nowhere to go. Nothing is lost or nagged, but it stops mattering (roadmap 1).
- Cloud browser software rendering runs at roughly 4 fps, so timing-sensitive checks need polling
  rather than fixed waits.
