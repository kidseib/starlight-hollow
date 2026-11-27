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
- Verify with `node --test tests/*.test.js` and `npm run build`, then look at the change in the
  browser (`window.__starlight` exposes game, camera, scene, audio, voice and HUD).
- Record every iteration in `docs/ITERATIONS.md` and `DEVELOPMENT_LOG.md`, and keep `CHANGELOG.md`
  accurate for the build that was published.
- A Windows playtest is never implied by a successful cloud build. Say what was not tested.
