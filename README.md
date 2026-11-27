# Starlight Hollow

**A gentle first-person adventure for young explorers, ages 5–7.** Follow Pip, a little firefly-bird, through five floating islands. Befriend bouncy creatures, gather sparkles, and find the five Starberries that will wake the sleeping Star Tree.

Starlight Hollow is an **in-development beta**. The current Windows build has a complete Starberry quest and a story ending; the larger game vision is still in progress.

[Download the Windows x64 beta](https://github.com/kidseib/starlight-hollow/releases/download/v0.1.1-beta.1/Starlight-Hollow-Windows-x64.zip) · [Release notes](https://github.com/kidseib/starlight-hollow/releases/tag/v0.1.1-beta.1) · [Report feedback](https://github.com/kidseib/starlight-hollow/issues/new)

## The adventure

Sunbeam Meadow is home base. Its five arches lead to islands with different sights and playful challenges. Explore at your own pace, use the Star Blaster to interact with signs and creatures, and bring each island's Starberry back to the tree. Pip follows, gives a nudge when you're stuck, and celebrates discoveries.

| Place | What you discover |
| --- | --- |
| **Sunbeam Meadow** | The hub, practice signs, portals, and Star Tree |
| **Letterleaf Grove** | Letters, sounds, and building a word |
| **Tallybrook Falls** | Counting, number order, addition, and subtraction |
| **Pattern Peaks** | Picture patterns and watch-then-copy memory signs |
| **Storysong Glade** | Beginning sounds, rhymes, syllables, and words |
| **Pebblecount Cove** | Pictured quantities and small number puzzles |

The current game has **29 short signs** across the hub and islands, plus friendly Puffkins, silly Grumbleweeds, sparkles to collect, and a Starberry for each adventure island. Signs use picture and symbol cues alongside spoken prompts; wrong answers allow unlimited retries and offer a gentle hint. The game saves progress locally and resumes on the last island visited.

## Play the Windows beta

1. [Download the ZIP](https://github.com/kidseib/starlight-hollow/releases/download/v0.1.1-beta.1/Starlight-Hollow-Windows-x64.zip) and extract it.
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

**Beta playtest focus:** Try R with mouse look locked, then the repeat button in drag-to-look mode. Leave an unsolved sign and check that its prompt clears while newer dialogue stays visible. At the next sign, both controls should repeat the new prompt. In Pattern Peaks, replay a memory sequence after starting an attempt. Also check offline voice, save and reopen, the installer shortcut, and uninstall. [Send findings through GitHub Issues](https://github.com/kidseib/starlight-hollow/issues/new); please omit children's personal information.

ZIP SHA-256: `f988975385f7d09151a43b5d30957dfae1ba0d0d04e3a46a7317d655d6f73dcb`

## What the project is building toward

The long-term goal is a polished, offline adventure where exploration and playful tools naturally reinforce early reading, maths, memory, and problem-solving. Planned work includes a parent dashboard, adaptive practice by subject, telling-time activities, touch controls and an Android build, more free-play activities, and local cooperative play. **These planned features are not in the current Windows beta.** The [game design reference](docs/GAME_DESIGN.md) and [iteration history](docs/ITERATIONS.md) track the current design, known gaps, and test evidence.

## How it is built

| Part | Implementation |
| --- | --- |
| World and first-person play | Three.js and vanilla JavaScript modules |
| Development and web build | Vite 5 |
| Windows app | Electron, packaged as portable and NSIS installer builds by electron-builder |
| Art and sound | Original procedural geometry, canvas-drawn signs, synthesized music and effects |
| Font and speech | Bundled Fredoka font; speech through the OS Web Speech API |
| Save data | Local browser/Electron storage with a previous-checkpoint fallback |

The Windows app serves bundled assets through a local Electron protocol and blocks HTTP(S) requests during play. GitHub Actions runs save regression tests, builds both Windows EXEs, checks the ZIP, and attaches it to the prerelease. The project uses Three.js (MIT) and Fredoka (SIL Open Font License); their license texts are included with the Windows app. No external account or gameplay service is required.

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
