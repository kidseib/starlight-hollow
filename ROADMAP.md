# Roadmap

Ordered by how much it helps a five-to-seven-year-old play on their own. Updated at the end of
every development iteration; `docs/GAME_DESIGN.md` tracks the current design.

## Now (next two iterations)

1. ~~**Knowledge that changes the island everywhere**~~ — done in iterations 29–30: all six themed
   worlds have a world-embedded gate. The Grove bramble opens a pocket, the Falls raise a lily path,
   the Glade wakes a rune path, the Peaks pattern-lift a deck to a sky shelf, the Cove counts open a
   shell, and the Hollow's moonword parts a moth curtain. The next step is to make each payoff a
   little more visible from the approach and to add a second, optional use for the same knowledge.
2. ~~**Secrets behind a small puzzle**~~ — done in iteration 27: the grove's storybook sleeps behind a
   leaf drift the Leafwhisk sips away and the peaks' star chart behind a frost bell one bolt rings. Both
   doors stay open in the save. A third nook needing a jump from a ledge is still open below.
2. **A grotto veil that reads as fabric** — it is a glow and a translucent sheet today; woven ribbons
   or drifting motes in the arch would sell "asleep" better.
3. **A keepsake worth finding further out** — the meadow's three are close to the path; one grove or
   peaks find could need a jump or a gadget so the last keepsake feels like a journey.
4. ~~**A second thing to spend bundles on**~~ — done in iteration 24: a full bed hands every further
   gift to the Moon Arbor, six lights wake it and a moon moth moves in, and wishes keep accepting
   bundles forever.
5. ~~**A use for what the whisk gathers**~~ — done in iteration 23: petals, sun puffs and mote lanterns
   each grow their own spot in Pip's garden on the meadow path.
6. ~~**A second use for the Leafwhisk beyond leaves**~~ — done in iteration 22: petals, dust and glow
   motes are authored, gatherable scenery in every themed world, each with its own bundle and its own
   once-a-session hello.
7. **A real-device pass** — touch and gamepad were proved with emulated pointer events and an injected
   pad. The first Android APK and Windows 0.1.5 build now exist (iteration 31), but neither has run on
   physical hardware.
8. **A real Windows playtest of the current beta** — both editions, narration with the network off,
   save and reopen, installer shortcut, uninstall. The source still has to be published to match the
   binaries.
9. **Engine follow-through** — the portrait/title screens and dense creature crowds are the next
   draw-call hotspots after static batching; profile on a real mid-range phone and a laptop iGPU
   before adding more scenery.

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
- The arbor's moon is a stylised carve: the terminator is faked in the camera's frame, so the lit side
  always faces the child and the dark side is flat indigo. That is deliberate for legibility at 5 m,
  not an astronomical simulation.
- Pip's garden and the arbor exist only in the meadow; the other islands have gathering but no place
  of their own for what it makes.
- Cloud browser software rendering runs at roughly 4 fps, so timing-sensitive checks need polling
  rather than fixed waits.
