# Development log

Newest first. Each entry records what changed, how it was checked, and what is still open. The
long-form narrative is in `docs/ITERATIONS.md`; player-facing notes are in `CHANGELOG.md`.

---

## Iteration 10 - Momo's Wisp Market (2026-11-27)

**Chosen because** sparkles were the only collectible with no use: a child
gathered hundreds and could never do anything with them. The market turns that
number into three abilities, and gives the hub a place worth walking to.

**Changed**

- `src/game/shop.js` (new): gift data, `shopStatus()` and `purchase()` as pure
  functions, plus `MarketStall` - striped stall, glass jars, lanterns, and Momo
  the lantern-snail with blinking eyestalks, a breathing shell and a shy smile.
- `src/ui/hud.js`, `index.html`, `src/style.css`: market panel with picture
  cards, purse, owned/ready/saving states, a shake for "not yet", and gold
  upgrade badges under the sparkle counter.
- `src/game/game.js`: market spawn from a `MARKET` constant in the hub, Momo as
  an aim and zap target, `openShop`/`closeShop`/`buyItem`, `_applyUpgrades()` and
  `_updateMarket` (including the first nudge when a child comes within 10 m), plus
  the state branch that lets the world wait while shopping.
- Effects wired into the systems themselves: `SparkleManager.magnetRange` and
  `magnetPull`, the companion-hint wait in `_updateCompanionHint`, and
  `Blaster.setRainbow()` (sRGB hues so the bolts are not pastel).
- `src/engine/save.js`: `upgrades` saved and sanitised; older saves load with an
  empty list, so the v1 key is untouched.
- `src/world/props.js`: the altar under the Star Tree rebuilt - mossy footing,
  stone drum, gold band, lit top and five rune lights - replacing the plain
  grey cylinder every player walks up to.
- `tests/shop.test.js`: 8 cases for prices, affordability, duplicates, unknown
  ids, card states and saved upgrades. The Windows workflow now runs that file
  too.

**Verified**

- `node --test tests/*.test.js` -> 17 pass, 0 fail. `npm run build` -> exit 0.
- Cloud browser, real render loop: walked to the stall, crosshair went hot,
  a queued zap opened the market (`state === 'shop'`, purse 9, three cards
  saving); clicking the magnet card shook it and charged nothing; after
  collecting sparkles all three gifts were bought for 40 + 70 + 110, cards turned
  owned, chips appeared, jars switched to stars and the banner named each gift.
- Effects measured: a sparkle placed 8.09 m away drifted to 4.27 m (default pull
  radius is 4.6 m, so only the magnet could have moved it); the bolt colour
  changed on the next zap; the HUD showed all three badges.
- Saved, reloaded: `upgrades: ['magnet','bell','rainbow']`, magnet range 9.5,
  rainbow on, jars sold, badges redrawn. No page errors in the runs that
  recorded them.
- Screenshots: `artifacts/r10-market-approach.png`, `-stall.png`, `-panel.png`,
  `-owned.png`, `-after-reload.png`, `artifacts/r10-altar.png`.

**Open**

- Audible narration, real pointer-lock clicking and both Windows executables
  were not exercised here; the cloud browser renders at about 4 fps.
- The market has exactly three gifts and no rotation; a child who buys all three
  runs out of things to save for.
- Speech still needs a local English Windows voice.

**Next actions**

1. Ship 0.1.3-beta.1 through the Windows workflow and verify the public ZIP.
2. A second use for sparkles - decorating the Star Tree - so saving continues
   after the three gifts.
3. Finish the long-standing pattern-sign wrong/right evidence.

---

## Iteration 9 — Gentler second chances (2026-11-27)

**Chosen because** the game's weakest moment for a five-year-old was failing the same question
twice: the prompt repeated, the hint arrived, but the question itself stayed exactly as hard.

**Changed**

- `src/game/station.js`: `mistakes` counter, `_narrowChoices()` called from the wrong-answer timer.
  After two misses, one wrong choice per miss dims to `pad.state === 'dim'`, stopping at two
  choices; the answer pad is never dimmed; `pick` and `pattern` only. `activate()` resets the
  counter so a fresh approach starts whole.
- `src/world/pads.js`: new `dim` pad state (grey-lilac ring, 0.22 face opacity, scale 0.8, no glow)
  so a removed choice still reads as part of the plinth instead of vanishing.
- `src/game/game.js`: a small star sprite above each arch, shown once `stars[portal.def.to]` is set;
  `_refreshPortalBadges()` runs after loading a save and after collecting a Starberry, and dims the
  finished arch's beacon.
- `tests/station-recovery.test.js`: five cases for the narrowing rules.
- Version `0.1.2-beta.1` across `package.json`, `package-lock.json`, the lock chunks, `START-HERE`,
  README; Windows workflow now takes the release tag as a `workflow_dispatch` input and runs the new
  tests.
- New persistent records: `AGENTS.md`, `ROADMAP.md`, `CHANGELOG.md`, this log.

**Verified**

- `node --test tests/save.test.js tests/station-recovery.test.js` → 9 pass, 0 fail.
- `npm run build` → exit 0 (only the known chunk-size warning).
- Cloud browser, real render loop: two wrong zaps at `meadow-shape` → pads `active, dim, active`,
  2 aim candidates, `Easier now!`; leave → all sleep; return → all active, `mistakes` 0. Page error
  collector empty.
- `_collectStarberry('peaks')` → arch badge visible at world y 6.0, beam 0.04, goal chip updated.
- Screenshots: `artifacts/r9-easier-choices.png` (triangle bright, circle bright, square greyed),
  `artifacts/r9-arch-star.png` (star above the Pattern Peaks arch).

**Open**

- Windows beta `0.1.2-beta.1` shipped: Actions run #4 passed, the ZIP was attached and the prerelease
  published; a signed-out download returned HTTP 200 with SHA-256
  `ae6e5f7716df87a8bc55a696d9b9c8d491784c75be594872b9fc3929612e6020` and three intact entries.
- Audible speech, real pointer-lock zapping and the packaged Windows builds were not exercised.
- The two pattern signs still lack the full wrong/correct capture promised in iteration 6.
- A human Windows playtest is still needed: both editions, R and the button, the faded choice, an
  arch star, offline narration, save and reopen, the installer shortcut, and uninstall.

**Next actions**

1. Confirm the Windows workflow's next dispatch only passes `tag`; the extra `version` input silently
   aborts the dispatch.
2. Add a grown-up progress corner to the pause screen (letters, numbers, patterns, memory counts).
3. Finish the pattern-sign wrong/right evidence, including the filled blank after a reload.

---

## Iterations 6–8 — pattern signs, resume, replay (2026-11-27)

- Iteration 6: `pattern` station type with an animated picture row, `seq` sign plate, filled answer
  slot on solve/restore, double-sided tiles, 29-station audit with no placeholders.
- Iteration 7: resume on the last island with its own greeting, previous-checkpoint backup, save
  sanitising, ending flag restored, no sixth Starberry from meadow practice signs.
- Iteration 8: **R** and the on-screen button repeat the nearest sign; leaving a sign clears only
  its own bubble; memory signs replay their light sequence.
- Windows beta 0.1.1-beta.1 built by GitHub Actions, published as a public prerelease, downloaded
  unauthenticated (HTTP 200) and matched to its SHA-256.
