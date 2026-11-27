# Starlight Hollow

Starlight Hollow is a gentle first-person educational adventure for ages 5–7. Explore floating islands with Pip, befriend creatures, and solve picture, letter, number, and memory puzzles to wake the Star Tree.

## Windows playtest

The **0.1.1-beta.1** Windows x64 build is prepared. The ZIP will appear under [Releases](https://github.com/kidseib/starlight-hollow/releases) once it has been attached and the draft is published. Download the Windows ZIP, not GitHub’s generated source archives.

Extract the entire ZIP and choose `Starlight-Hollow-Portable.exe` to play without installing, or `Starlight-Hollow-Setup.exe` to install for your Windows account. `START-HERE.txt` is included. Windows 10/11 x64 and a WebGL-capable graphics driver are required; no separate Node.js or browser installation is needed. This beta is unsigned and may show an unknown-publisher warning. Spoken prompts depend on an installed English Windows voice; subtitles are available without it.

## What to test

- Launch each edition. Check mouse look, WASD, pause and resume, and close and reopen to confirm progress survives.
- At an unsolved sign, press **R** while mouse look is locked. Confirm the line repeats without releasing the mouse. In drag-to-look mode, use the on-screen repeat button and compare.
- Leave an unsolved sign. Only its prompt should disappear. Confirm both controls repeat the next sign, not the old one.
- At a Pattern Peaks memory sign, start copying after the demonstration, then replay. The lights should play once in order and allow a fresh attempt. Repeated requests during the demo should not queue another round.
- Check voice with the internet disconnected. For Setup, check the Start menu shortcut and uninstall.

Report issues [here](https://github.com/kidseib/starlight-hollow/issues/new). Include Windows version, portable vs. installed, steps, and expected vs. actual results. Please leave out children's names or personal information.
