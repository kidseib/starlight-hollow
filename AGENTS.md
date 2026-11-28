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
- Verify with `node --test tests/*.test.js` and `npm run build`, then look at the change in the
  browser (`window.__starlight` exposes game, camera, scene, audio, voice and HUD).
- Record every iteration in `docs/ITERATIONS.md` and `DEVELOPMENT_LOG.md`, and keep `CHANGELOG.md`
  accurate for the build that was published.
- A Windows playtest is never implied by a successful cloud build. Say what was not tested.
