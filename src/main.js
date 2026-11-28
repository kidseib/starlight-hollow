import "@fontsource-variable/fredoka";
import * as THREE from 'three';
import { Input } from './engine/input.js';
import { GameAudio } from './engine/audio.js';
import { Voice } from './engine/voice.js';
import { HUD } from './ui/hud.js';
import { TouchControls } from './ui/touch.js';
import { Game } from './game/game.js';
import { reducedMotion, setReducedMotion } from './engine/motion.js';
import { AdaptiveResolution } from './engine/renderQuality.js';

const canvas = document.getElementById('game');

const coarsePointer = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({
  canvas,
  // MSAA is expensive on phone GPUs and high-DPI screens hide the jaggies.
  antialias: !coarsePointer,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

// Render at a sane resolution and let the governor lower it only when frames
// are actually slow. A 3x phone screen does not need 3x the pixels to look good.
const quality = new AdaptiveResolution(renderer, {
  deviceRatio: window.devicePixelRatio || 1,
  maxRatio: 1.75,
});
const perf = { fps: 0, frameMs: 0, drawCalls: 0, triangles: 0, pixelRatio: quality.pixelRatio, qualitySteps: 0 };

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 900);
scene.add(camera);

const input = new Input(canvas);
const audio = new GameAudio();
const voice = new Voice();
const hud = new HUD({ voice, audio });
const game = new Game({ scene, camera, renderer, input, audio, voice, hud });

const touchControls = new TouchControls({ input, coarsePointer });
touchControls.setVisible(false);

input.onDevice = (device) => {
  hud.setDevice(device);
  touchControls.syncForDevice(device);
};
input.onPause = () => {
  // Start is a toggle, like Escape: a pad-only child can always pause and come back.
  if (game.state === 'play') game.pause();
  else if (game.state === 'paused') game.resume();
  else if (game.state === 'paused') game.resume();
  else if (game.state === 'shop') game.closeShop();
};
input.onRepeat = () => game.repeatInstruction();
hud.setDevice(input.device);

game.hud.setVisible(false);
hud.setFadeImmediate(false);

const titleScreen = document.getElementById('title-screen');
const playBtn = document.getElementById('play-btn');
const resumeBtn = document.getElementById('resume-btn');
const muteBtn = document.getElementById('mute-btn');
const endingBtn = document.getElementById('ending-btn');

let started = false;

playBtn?.addEventListener('click', () => {
  if (started) return;
  started = true;
  audio.init();
  audio.resume();
  voice.warmUp();
  titleScreen?.classList.add('hidden');
  game.start();
});

resumeBtn?.addEventListener('click', () => {
  audio.ui();
  game.resume();
});

endingBtn?.addEventListener('click', () => {
  audio.ui();
  game.continueAfterEnding();
});

let muted = false;
function setMuted(next) {
  muted = next;
  audio.setMuted(muted);
  voice.setEnabled(!muted);
  if (muteBtn) muteBtn.textContent = muted ? 'Sound: off' : 'Sound: on';
}
muteBtn?.addEventListener('click', () => {
  audio.ui();
  setMuted(!muted);
});

const motionBtn = document.getElementById('motion-btn');
function paintMotion() {
  if (motionBtn) motionBtn.textContent = `Calm motion: ${reducedMotion() ? 'on' : 'off'}`;
}
paintMotion();
motionBtn?.addEventListener('click', () => {
  audio.ui();
  setReducedMotion(!reducedMotion());
  paintMotion();
});

const repeatInstruction = () => game.repeatInstruction();
hud.repeatBtn?.addEventListener('click', repeatInstruction);

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
    repeatInstruction();
  }
  if (e.code === 'Escape') {
    if (game.state === 'play') game.pause();
    else if (game.state === 'paused') game.resume();
    else if (game.state === 'shop') game.closeShop();
  }
  if (e.code === 'KeyM') setMuted(!muted);
});

window.addEventListener('pagehide', () => game.flushProgress());

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'play') game.pause();
});

// If the browser refuses pointer lock, tell the child how to look around.
canvas.addEventListener('pointerlockerror', () => {
  hud.showHint('Hold the mouse button and drag to look around!', 6000);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  quality.resize();
});

let lastTime = performance.now();
let elapsed = 0;
let perfFrames = 0;
let perfTime = 0;

function loop(now) {
  const raw = Math.max(0.0005, (now - lastTime) / 1000);
  const dt = Math.min(0.05, raw);
  lastTime = now;
  elapsed += dt;
  input.pollGamepad(dt);
  game.update(dt, elapsed);
  renderer.render(scene, camera);

  perfFrames++;
  perfTime += Math.min(raw, 0.5);
  if (perfTime >= 0.5) {
    perf.fps = Math.round(perfFrames / perfTime);
    perf.frameMs = +((perfTime * 1000) / perfFrames).toFixed(1);
    perfFrames = 0;
    perfTime = 0;
  }
  perf.drawCalls = renderer.info.render.calls;
  perf.triangles = renderer.info.render.triangles;
  perf.pixelRatio = quality.pixelRatio;
  perf.qualitySteps = quality.steps;
  if (!document.hidden) quality.sample(Math.min(raw, 0.25));

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Expose for quick console debugging during development.
window.__starlight = { game, scene, camera, renderer, audio, voice, hud, perf, quality };
