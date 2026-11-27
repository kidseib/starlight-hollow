# Starlight Hollow

Starlight Hollow is a gentle first-person educational adventure for ages 5–7. Explore floating islands with Pip, befriend creatures, and solve picture, letter, number, and memory puzzles to wake the Star Tree.

## Download the Windows beta

[Download Starlight Hollow v0.1.1-beta.1 for Windows x64](https://github.com/kidseib/starlight-hollow/releases/download/v0.1.1-beta.1/Starlight-Hollow-Windows-x64.zip) · [Release notes](https://github.com/kidseib/starlight-hollow/releases/tag/v0.1.1-beta.1)

Extract the ZIP. Run `Starlight-Hollow-Portable.exe` without installing, or run `Starlight-Hollow-Setup.exe` to install for your Windows account. `START-HERE.txt` is included. Windows 10/11 x64 and a WebGL-capable graphics driver are required. The game and runtime are bundled; no separate Node.js or browser is needed. The beta is unsigned, so Windows may show an unknown-publisher warning. Spoken prompts need an installed English Windows voice; subtitles remain available.

ZIP SHA-256: `f988975385f7d09151a43b5d30957dfae1ba0d0d04e3a46a7317d655d6f73dcb`

## What to test

- Launch both editions. Check mouse look, WASD, pause and resume, then close and reopen to confirm progress survives.
- At an unsolved sign, press **R** with mouse look locked. In drag-to-look mode, use the on-screen repeat button. Both should repeat the same sign.
- Leave an unsolved sign. Its prompt should disappear without hiding newer dialogue. At the next sign, both controls should repeat the new prompt.
- At a Pattern Peaks memory sign, begin copying after the demonstration, then replay. The lights should run once in order and allow a fresh attempt; repeated requests during the demonstration should not queue another round.
- Disconnect from the internet and check narration with a local English Windows voice. For Setup, check the Start menu shortcut and uninstall.

[Report playtest feedback](https://github.com/kidseib/starlight-hollow/issues/new). Include your Windows version, which edition you used, steps to reproduce, and what happened. Please omit children's personal information.

## Building from source

The Windows release is built by [GitHub Actions](.github/workflows/windows-beta.yml). The pinned npm lockfile is stored in `.github/lock-parts/` for the GitHub integration's file-size limit and restored by the workflow before `npm ci`. The project uses Vite, Three.js, and Electron. The core game runs locally without accounts or online services.
