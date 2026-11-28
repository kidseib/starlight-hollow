# Starlight Hollow

**A gentle first-person adventure where ages 5–7 learn letters, sounds, words and numbers by exploring — not by answering quizzes.**

You wake in Sunbeam Meadow with a small firefly-bird named **Pip** on your shoulder. Six arches lead to floating islands full of soft grass, paper lanterns, bouncy creatures and hidden corners. There is a sleeping Star Tree to wake, a garden to grow, a market to visit, keepsakes to find and — once you have made a real wish — a second world behind a bramble-covered arch.

No timers. No lives. No wrong-answer punishment. Everything a child meets is spoken aloud, so reading is never a requirement to play.

[Download the latest Windows or Android beta](https://github.com/kidseib/starlight-hollow/releases/latest) ·
[Changelog](CHANGELOG.md) · [Design reference](docs/GAME_DESIGN.md) ·
[Progress review](docs/REVIEW.md) ·
[Report feedback](https://github.com/kidseib/starlight-hollow/issues/new)

> **Status:** the **0.1.5 beta** ships Windows x64 and an Android sideload APK. Six themed islands now each carry a knowledge gate that changes the place itself; the engine batches static scenery, detaches far islands and adapts resolution to hold a steadier frame. The Android build is debug-signed and has not run on a physical device yet. See [Roadmap and status](#roadmap-and-status).

## Why it feels different

- **Exploration is the reward.** Islands hide keepsakes, lantern trees, moonpetal ponds and quiet corners. You can ignore every learning sign and still have a place worth wandering.
- **Learning lives in the world.** A sign is a wooden board with pictures and symbols; a wrong answer fades to grey and leaves two friendly choices; hints arrive by themselves. Nothing is graded.
- **Everything is spoken, twice if you ask.** Speech carries every instruction; on-screen text only mirrors it, so a child who cannot read yet can play alone.
- **Gentle by design.** Calm-motion mode, no failure states, no streaks, no "come back tomorrow", no advertising, no purchases, no accounts, and no network connection needed to play.

## The world

| Place | What is there |
| --- | --- |
| **Sunbeam Meadow** | Home. The Star Tree, Pip's garden and Moon Arbor, Momo's Wisp Market, the keepsake shelf, the Moonwell Grotto and six arches |
| **Letterleaf Grove** | Letter names, letter sounds, blending and first words |
| **Tallybrook Falls** | Counting, number order, addition and subtraction |
| **Pattern Peaks** | Picture patterns and watch-then-copy memory |
| **Storysong Glade** | Beginning sounds, rhymes, syllables and word building |
| **Pebblecount Cove** | Pictured quantities and small number puzzles |
| **Lantern Hollow** | A dusk island behind a sleeping arch: a moonpetal pond, a lantern walk, a stream, moths, two hidden prizes, a moonword gate and one Leafwhisk puzzle |

## Learning without a quiz show

| Subject | How it appears |
| --- | --- |
| Letters & phonics | Letter boards, sound matching, blending a word from its sounds |
| Words & sentences | Word building, rhymes, syllables, simple sentence reading |
| Counting & number | Counting pictured things, number order, quantities, compare |
| Addition & subtraction | Small sums with pictures and counters, then numerals |
| Memory & patterns | Watch-then-copy sequences and repeating picture patterns |
| Problem solving | Finding what a tool opens, what a shape fits, where a path leads |

**Adaptive difficulty is per subject.** The pause screen's grown-up corner records how many signs a child has met and how often the first answer landed, then offers Auto, Gentle or Stretch for reading and for maths independently — because a child can be strong at counting and still be learning letters.

**Not in the public beta yet:** telling time, measurement, money, local two-player co-op, separate child profiles, and a full parent dashboard beyond the pause-screen panel. These are on the roadmap, not in the build.

## Toys, tools and things to find

- **Starbolt** — a friendly blaster that wakes signs, rings bells and pops harmless creatures into giggles. Forgiving aim, no damage, no death.
- **Leafwhisk** — a vacuum that gathers leaf drifts and sips away curtains of sleepy ferns.
- **Scanning gaze** — look steadily at a listening stone and it tells you a small true fact.
- **Garden and Moon Arbor** — bring gathered bundles to Pip's garden; fill the bed, then wake the arbor; every wish after that carves the moon a little further through its phases.
- **Thirteen keepsakes** — two hidden finds on every island and three in the meadow, shown on the meadow shelf and in each island's cairn. Two of them sleep behind doors that want a tool.
- **Star Tree Workshop** — find a star shard on each island, then hang ornaments on the tree's garlands.
- **Momo's Wisp Market** — spend sparkles on permanent gifts (magnet, bell, rainbow blaster, sky lantern). No real money, ever.
- **Hub growth** — keep the meadow changing: lanterns, pennants, pavers, fireflies and a grotto that opens only when all thirteen keepsakes are found.

## Controls

| Action | Keyboard & mouse | Touch | Gamepad |
| --- | --- | --- | --- |
| Walk | WASD / arrows | Thumb pad | Left stick |
| Look | Mouse | Drag to look | Right stick |
| Zap / hold tool | Click | Zap button | A / trigger |
| Switch tool | Q or right-click | Tool button | B |
| Jump | Space | Jump button | A |
| Repeat the nearby sign | R | Repeat button | Y |
| Pause | Esc | Pause button | Start |

Aiming is assisted on every device, and the suction cone is deliberately wide. Calm motion is in the pause screen and follows the operating system setting by default.

## Grown-ups: safety and privacy

- **Offline.** The game runs from local files; the Windows app blocks network requests during play.
- **No accounts, no ads, no microtransactions, no loot boxes, no energy timers, no push notifications.**
- **Local saves only**, with a previous-checkpoint fallback so a corrupted write cannot wipe progress.
- **Speech** uses the operating system's installed English voice; subtitles remain available if no voice is installed. Nothing is recorded or uploaded.
- **No personal data is collected.** Please leave children's personal information out of GitHub issues.

## Roadmap and status

**Done and playable:** the seven places above, 29 learning signs, six world-embedded knowledge gates, 13 keepsakes, the garden → arbor → moon-phase loop, hub growth, the Star Tree Workshop, four market gifts, the Starberry quest and ending, four input paths, calm motion, the Lantern Hollow second world with its unlock and prizes, batched scenery with far-island detachment, adaptive resolution, and a fullscreen landscape Android build.

**Next, in priority order:** test the APK on a real Android phone/tablet and the Windows build on a real PC (audio, controller, save/reopen); publish the source that matches these builds; replace the debug APK with a signed release/AAB; local two-player co-op; child profiles and a fuller grown-up dashboard; telling-time and measurement activities; richer creature behaviour and character voice.

**Known limits:** the voice is the operating system's speech synthesis, so pronunciation warmth varies by machine; the Android APK is debug-signed and sideload-only; Android and controller hardware have not been tested; islands are compact and some asset families repeat. The cloud test browser renders in software, so the draw-call and triangle counts — not its FPS readout — are the performance evidence.

## Build from source

Install Node.js 22 and npm. The public repository stores the pinned lockfile as base64 chunks in `.github/lock-parts/`; restore it before `npm ci` when using a GitHub checkout:

```powershell
$parts = Get-ChildItem .github/lock-parts/*.txt | Sort-Object Name
$encoded = ($parts | ForEach-Object { (Get-Content $_.FullName -Raw).Trim() }) -join ''
[IO.File]::WriteAllBytes('package-lock.json', [Convert]::FromBase64String($encoded))
npm ci
npm run dev
```

```bash
node --test tests/*.test.js   # 106 tests: saves, progression, signs, tools, gates, puzzles, performance
npm run build                 # production web bundle
npm run build:windows         # Windows: portable EXE, installer and ZIP in artifacts/
npx cap sync android          # copy dist into the Android project
cd android && ./gradlew assembleDebug   # Android: app-debug.apk (debug-signed)
```

| Part | Implementation |
| --- | --- |
| World and first-person play | Three.js and vanilla JavaScript modules |
| Development and web build | Vite 5 |
| Windows app | Electron, packaged with electron-builder |
| Android app | Capacitor 7 WebView shell, Android SDK 35, landscape immersive activity |
| Renderer budget | Static mesh batching, far-island detachment, adaptive resolution (`src/world/staticMerge.js`, `src/engine/renderQuality.js`) |
| Art and sound | Original procedural geometry, canvas-drawn signs, synthesised music and effects |
| Font and speech | Bundled Fredoka font; speech through the OS Web Speech API |
| Save data | Local storage with a previous-checkpoint fallback |

Three.js (MIT) and Fredoka (SIL Open Font License) are used under their licenses; their texts ship with the Windows app.
