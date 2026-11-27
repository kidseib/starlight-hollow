import * as THREE from 'three';
import { Input } from './engine/input.js';
import { GameAudio } from './engine/audio.js';
import { Voice } from './engine/voice.js';
import { HUD } from './ui/hud.js';
import { Game } from './game/game.js';

const canvas = document.getElementById('game');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 900);
scene.add(camera);

const input = new Input(canvas);
const audio = new GameAudio();
const voice = new Voice();
const hud = new HUD({ voice, audio });
const game = new Game({ scene, camera, renderer, input, audio, voice, hud });

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

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (game.state === 'play') game.pause();
    else if (game.state === 'paused') game.resume();
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

let lastTime = performance.now();
let elapsed = 0;

function loop(now) {
  const dt = Math.min(0.05, Math.max(0.0005, (now - lastTime) / 1000));
  lastTime = now;
  elapsed += dt;
  game.update(dt, elapsed);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Expose for quick console debugging during development.
window.__starlight = { game, scene, camera, renderer, audio, voice, hud };
