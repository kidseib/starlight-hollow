# Starlight Hollow

**A gentle first-person adventure for young explorers, ages 5–7.** Follow Pip, a little firefly-bird, through five floating islands. Befriend bouncy creatures, gather sparkles, and find the five Starberries that will wake the sleeping Star Tree.

Starlight Hollow is an **in-development beta**. The current Windows build has a complete Starberry quest, a quiz-free decorating workshop and a story ending; the larger game vision is still in progress.

[Download the Windows x64 beta](https://github.com/kidseib/starlight-hollow/releases/download/v0.1.4-beta.1/Starlight-Hollow-Windows-x64.zip) · [Release notes](https://github.com/kidseib/starlight-hollow/releases/tag/v0.1.4-beta.1) · [Changelog](CHANGELOG.md) · [Report feedback](https://github.com/kidseib/starlight-hollow/issues/new)

## The adventure

Sunbeam Meadow is home base. Its five arches lead to islands with different sights and playful challenges. Explore at your own pace, use the Star Blaster to interact with signs and creatures, and bring each island's Starberry back to the tree. Pip follows, gives a nudge when you're stuck, and celebrates discoveries.

| Place | What you discover |
| --- | --- |
| **Sunbeam Meadow** | The hub, practice signs, portals, Star Tree and Momo's market |
| **Letterleaf Grove** | Letters, sounds, and building a word |
| **Tallybrook Falls** | Counting, number order, addition, and subtraction |
| **Pattern Peaks** | Picture patterns and watch-then-copy memory signs |
| **Storysong Glade** | Beginning sounds, rhymes, syllables, and words |
| **Pebblecount Cove** | Pictured quantities and small number puzzles |

The current game has **29 short signs** across the hub and islands, plus friendly Puffkins, silly Grumbleweeds, sparkles to collect, and a Starberry for each adventure island. Momo's Wisp Market in the meadow trades those sparkles for four permanent gifts: a Star Magnet that pulls sparkles from further away, Pip's Bell that makes hints arrive sooner, a Rainbow Blaster that gives every zap the next colour of the rainbow, and the **Sky Lantern** that becomes the sixth ornament for the Star Tree. Signs use picture and symbol cues alongside spoken prompts; wrong answers allow unlimited retries, and after two misses the choices themselves get smaller, leaving the right answer and one friendlier option. Finished islands mark their arch in the meadow with a small star. The game saves progress locally and resumes on the last island visited.

**The Star Tree Workshop.** Each of the five islands hides one glowing star shard under a tall beam of light: a golden star, a silver moon, a pink blossom, a song bell and a sea shell. Collecting one puts its picture in the pouch under the sparkle counter. Back at the Star Tree, two gold garlands wrap the trunk with six hooks, each showing a dashed outline; zap the outline that matches a shape you carry and the ornament pops into place with a bounce and a spoken line. Hang all six, including Momo's lantern, and the tree turns luminous and decorated, a gold badge appears, and Pip and Momo both celebrate.

## Play the Windows beta

1. [Download the ZIP](https://github.com/kidseib/starlight-hollow/releases/download/v0.1.4-beta.1/Starlight-Hollow-Windows-x64.zip) and extract it.
2. Run **`Starlight-Hollow-Portable.exe`** to play without installing, or **`Starlight-Hollow-Setup.exe`** for a per-user installation.
3. Open `START-HERE.txt` in the ZIP for the quick-start guide.

The beta targets **Windows 10/11 x64** with a WebGL-capable graphics driver. Both EXEs include the game and its runtime. They are unsigned, so Windows may show an unknown-publisher warning. The core game runs without an account or internet connection. Spoken prompts use the operating system's speech service and need an installed English voice; subtitles remain available when speech is unavailable.

| Action | Control |
| --- | --- |
| Walk and look | WASD or arrow keys; mouse |
| Jump | Space |
| Use the Star Blaster | Click |
| Repeat the nearby sign | **R** or the on-screen repeat button |
| Pause | Esc |
| Toggle sound | M |

**Beta playtest focus:** Look for the tall beam of light on each island, walk into the shard under it, then take the shape back to the Star Tree and zap the dashed outline that matches it (the Sky Lantern is Momo's 90-sparkle gift). Hanging all six should decorate the tree, add a gold badge and make Pip and Momo celebrate, and the tree should still be decorated after reopening. Also find the striped stall between the meadow landing spot and the Star Tree, zap Momo, and buy or refuse each gift; bought gifts should show as gold badges beside the sparkle counter and still be yours after reopening the game. Then answer a sign wrongly twice and check that a wrong choice fades to grey, leaving two choices and the message "Easier now!", while the right answer stays bright. Walk away and back to confirm every choice returns. Finish an island, take its Starberry, and check that its meadow arch now carries a small star. Also try R with mouse look locked and the repeat button in drag-to-look mode, check offline voice, save and reopen, the installer shortcut, and uninstall. [Send findings through GitHub Issues](https://github.com/kidseib/starlight-hollow/issues/new); please omit children's personal information.

The 0.1.4 beta ZIP's SHA-256 is `7a69484f2a1c6fff77783ffb8fbd7c4aca033bef18de8a1a35640dc5fcf24ad9`. Every release on the [releases page](https://github.com/kidseib/starlight-hollow/releases) also shows its ZIP's checksum.

## What the project is building toward

The long-term goal is a polished, offline adventure where exploration and playful tools naturally reinforce early reading, maths, memory, and problem-solving. Planned work includes a parent dashboard, telling-time activities, touch controls and an Android build, more free-play activities, and local cooperative play. **These planned features are not in the current Windows beta.** The [game design reference](docs/GAME_DESIGN.md) and [iteration history](docs/ITERATIONS.md) track the current design, known gaps, and test evidence.

## How it is built

| Part | Implementation |
| --- | --- |
| World and first-person play | Three.js and vanilla JavaScript modules |
| Development and web build | Vite 5 |
| Windows app | Electron, packaged as portable and NSIS installer builds by electron-builder |
| Art and sound | Original procedural geometry, canvas-drawn signs, synthesized music and effects |
| Font and speech | Bundled Fredoka font; speech through the OS Web Speech API |
| Save data | Local browser/Electron storage with a previous-checkpoint fallback |

The Windows app serves bundled assets through a local Electron protocol and blocks HTTP(S) requests during play. GitHub Actions runs the save, market and sign regression tests, builds both Windows EXEs, checks the ZIP, and attaches it to the prerelease. The project uses Three.js (MIT) and Fredoka (SIL Open Font License); their license texts are included with the Windows app. No external account or gameplay service is required.

### Build from source

Install Node.js 22 and npm. The GitHub integration stores the pinned lockfile as base64 chunks in `.github/lock-parts/`; restore it before `npm ci` when using a GitHub checkout:

```powershell
$parts = Get-ChildItem .github/lock-parts/*.txt | Sort-Object Name
$encoded = ($parts | ForEach-Object { (Get-Content $_.FullName -Raw).Trim() }) -join ''
[IO.File]::WriteAllBytes('package-lock.json', [Convert]::FromBase64String($encoded))
npm ci
npm run dev
```

Open the local Vite address shown in the terminal to play the development version. Run `npm run build` for the web bundle or `npm run build:windows` on Windows to make the portable EXE, installer, and ZIP. The release workflow is in [`.github/workflows/windows-beta.yml`](.github/workflows/windows-beta.yml).
