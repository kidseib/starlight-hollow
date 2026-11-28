# Starlight Hollow — working notes for future agents

Read this first, then `DEVELOPMENT_LOG.md` (what happened), `ROADMAP.md` (what is next) and
`docs/GAME_DESIGN.md` (how the game works). `docs/ITERATIONS.md` holds the long-form history.

## What the project is

An original first-person educational adventure for children aged 5–7, built with Three.js and
vanilla JavaScript, bundled by Vite, and packaged for Windows with Electron. Five floating islands,
29 short learning signs, a companion named Pip, and a Starberry quest that wakes the Star Tree.
Everything a child meets is spoken aloud; text on screen only mirrors the speech.

## Commands

```bash
npm ci                 # restore dependencies (keep package-lock.json)
npm run dev            # Vite on 0.0.0.0:3000
node --test tests/*.test.js
npm run build          # production web bundle
npm run build:windows  # Windows only: portable EXE, installer and ZIP in artifacts/
```

The GitHub repository stores `package-lock.json` as base64 chunks in `.github/lock-parts/`; the
Windows workflow rebuilds the lockfile from them before `npm ci`. If you change the lockfile, rebuild
those chunks (`python3 - <<'PY'` … base64 split into 20000-character files, sorted by name).

## Ground rules

- Keep the child's experience forgiving: wrong answers never lose progress, hints arrive by
  themselves, and every activity is understandable from pictures plus speech.
- Use the existing station, audio, voice and save systems instead of parallel ones.
- Content lives in `src/content.js`. A new sign is data, not code.
- Do not break the v1 save key (`starlight-hollow-save-v1`); older saves must keep loading.
- Market gifts are data in `src/game/shop.js` (`SHOP_ITEMS`); their ids are what
  `save.upgrades` stores, so renaming one would take a purchased gift away. New
  gifts need a price, an icon, a spoken line and a real effect wired into the
  system they change.
- The Star Tree Workshop lives in `src/game/workshop.js` (pure rules plus the
  shard beacons and the six tree hooks) and `src/world/ornaments.js` (one shape
  painter used for pouch pictures, market cards, tree outlines and the 3D
  ornaments). `save.shards` holds collected shards, `save.placed` holds hung
  ornaments; both default to empty so older saves keep working. Hook positions
  follow the tapered trunk (`trunkRadius(y)`), so move a row only together with
  that helper.
- Hidden discoveries live in `src/game/secrets.js` (data + rules) and `src/world/discoveries.js`
  (the hollow, the meadow shelf and each island's keepsake cairn). Finding one is proximity only —
  never add a button, prompt or marker, and never charge or punish a second visit. `save.secrets`
  holds found ids and is sanitised to known secrets; adding a secret means adding it to `SECRETS`,
  which the shelf, the cairns and the tests all read. Every island must hide at least two and show
  its own finds in a cairn; the meadow shelf carries one keepsake per island plus a gem per secret,
  and the HUD chip carries the total. `progressByWorld`/`worldTotals`/`firstFoundInWorld` are the only
  place those counts are worked out, and a test enforces off-path placement.
- Adaptive difficulty lives in `src/game/progress.js` (pure) and is set only from the pause
  screen's grown-up corner (`src/ui/progressPanel.js`). Keep it per subject: `subjectOfStation`
  files a sign, `levelFor` chooses Gentle/Just right/Stretch, and `narrowAfter`/`hintDelay` are the
  only knobs a level may turn. Never let a level change sparkles, stars or save keys, and never let
  one subject's record affect another. `save.learning` and `save.difficulty` are sanitised on load.
- Every core action must be reachable on keyboard, mouse, touch and gamepad. Movement, look and zapping
  all go through `src/engine/input.js` (keyboard + mouse, gamepad polling, and the touch entry points);
  `src/ui/touch.js` is the thumb pad and buttons, and `src/game/controls.js` owns the legend text each
  device shows. Never add a control that only one device can reach, and keep the HUD legend in step by
  setting `device` through `Input.setDevice`.
- The hub's growth from keepsakes is pure data in `src/game/hubBloom.js` and 3D in
  `src/world/growth.js`: one lantern per find, a flag per island with a find, a bed per completed
  island, plus the staged counts that keep the meadow changing the whole way (`pavers`, `pennants`,
  per-island `fills`, `stones`, `rim`, `fireflies`, `veil`, `step`) — and the Moonwell Grotto which
  opens **only** at all thirteen. Keep new growth staged and monotonic: every count must come from
  `hubBloom`, never from adding up ids in the world code, and a junk save must not over-grow it. Never derive that state by
  adding up ids yourself, never let a save with junk ids open the grotto, and never make the grotto a
  menu, a locked door or a purchase — it is a place you walk into, and its chest is taken by walking
  up to it. `save.grotto` is a boolean that only accepts a literal `true`. The arch is carved stone
  (plinth, bands, capital, keystone, wall lanterns) with a boulder outcrop behind it and a dressed
  clearing: never leave it as bare cylinders in an empty lawn, and keep the scatter blocker at 10 m
  so no tree grows through it. Judge hub art at 1280×720, not in the portrait preview.
- A hub change announces itself from the same data: `growthChange(before, after)` in `hubBloom.js`
  diffs two `hubBloom()` results into the kinds that grew and the spoken line, and only ever returns a
  change when the sanitised count actually rose. Never write announcement copy in the world or game
  code — add it to `KIND_LINE`/the line builder so words and geometry cannot drift. `HubGrowth.flourish`
  and `flourishAt` only add light, a swell and a burst; they must never move the camera or take input,
  and `audio.grow(stage)` must stay distinct from `collect()` and `star()`. Resumed saves, reloads and
  duplicate finds must stay silent: celebrate only from the find that crossed the count.
- Reduced motion is `src/engine/motion.js`: `reducedMotion()` follows the OS setting until someone
  chooses in the pause screen's `Calm motion` button, and the choice lives in
  `starlight-hollow-calm-motion` (not in the save). Any new animation must soften or stop under it.
- Curious things live in `src/world/curios.js` (art and play state) and `src/game/curios.js` (pure
  rules, facts and lines); the placement is `curios` data in `src/content.js`, two per island, and each
  one is added to the scatter blockers. They must stay optional scenery: no prompt, no marker, no
  failure, nothing lost, and a first-play sparkle reward only once per session (`curioReward`). The
  leaf drift and crystal gather themselves back; a listening stone repeats its fact for free. Keep them
  on the existing verbs (a bolt and the scanning gaze) so all four devices keep working — the scanning
  stone was proved with `curioScanReady` and needs 0.7 s within 4.6 m of the aim point.
- The meadow shelf is one row of six keepsakes on a low bench with a gem per secret along the front;
  keep it readable from 3 m without walking around it, and keep the cove's nooks dressed by
  `buildCoveNook()` so its finds never sit on bare sand.
- Verify with `node --test tests/*.test.js` and `npm run build`, then look at the change in the
  browser (`window.__starlight` exposes game, camera, scene, audio, voice and HUD).
- Record every iteration in `docs/ITERATIONS.md` and `DEVELOPMENT_LOG.md`, and keep `CHANGELOG.md`
  accurate for the build that was published.
- A Windows playtest is never implied by a successful cloud build. Say what was not tested.
