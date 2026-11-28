import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { mergeStatic } from '../src/world/staticMerge.js';
import { nextRenderScale, AdaptiveResolution, RENDER_QUALITY } from '../src/engine/renderQuality.js';

test('render scale only moves when frames are clearly slow or clearly fast', () => {
  assert.equal(nextRenderScale(1, 16.7), 1);
  assert.equal(nextRenderScale(1, 40), 0.9);
  assert.equal(nextRenderScale(0.7, 40), RENDER_QUALITY.minScale);
  assert.equal(nextRenderScale(0.7, 10), 0.8);
  assert.equal(nextRenderScale(1, 10), 1);
  assert.equal(nextRenderScale(0.9, Number.NaN), 0.9);
  assert.equal(nextRenderScale(0.9, -4), 0.9);
});

test('adaptive resolution has hysteresis and never exceeds native ratio', () => {
  const calls = [];
  const fake = { setPixelRatio: (v) => calls.push(v) };
  const quality = new AdaptiveResolution(fake, { deviceRatio: 2, maxRatio: 2, startScale: 1 });
  assert.equal(quality.pixelRatio, 2);
  // A long, genuinely slow stretch steps down after the cooldown.
  for (let i = 0; i < 80; i++) quality.sample(0.05);
  assert.ok(quality.scale < 1, `expected a lower scale, got ${quality.scale}`);
  assert.ok(quality.pixelRatio < 2);
  assert.ok(quality.pixelRatio >= 2 * 0.65);
  const down = quality.scale;
  // A single fast frame does not yank it back.
  quality.sample(0.012);
  assert.ok(quality.scale <= down, 'a single fast frame never raises the resolution');
  // A sustained fast stretch walks it back toward native.
  for (let i = 0; i < 1400; i++) quality.sample(0.012);
  assert.equal(quality.scale, 1);
  assert.equal(quality.pixelRatio, 2);
  assert.ok(calls.length >= 3);
});

test('adaptive resolution leaves a 1x screen at native resolution', () => {
  const quality = new AdaptiveResolution({ setPixelRatio() {} }, { deviceRatio: 1, maxRatio: 2 });
  assert.equal(quality.pixelRatio, 1);
  for (let i = 0; i < 100; i++) quality.sample(0.05);
  assert.equal(quality.pixelRatio, 1);
});

test('static props merge by material and keep animated objects intact', () => {
  const root = new THREE.Group();
  root.position.set(20, 3, -4);
  root.rotation.y = 1.2;

  const shared = new THREE.MeshStandardMaterial({ color: 0x76c893, flatShading: true });
  const other = new THREE.MeshStandardMaterial({ color: 0xffd166, flatShading: true });
  const a = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), shared);
  a.position.set(-2, 0, 0);
  const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), shared);
  b.position.set(2, 0, 0);
  b.scale.setScalar(2);
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 5), other);
  c.position.set(0, 1, 0);

  const animated = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), shared);
  animated.name = 'animated';
  const animatedParent = new THREE.Group();
  animatedParent.add(animated);

  const hidden = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), other);
  hidden.position.set(0, 12, 0);
  hidden.visible = false;

  root.add(a, b, c, animatedParent, hidden);
  const before = root.children.length;

  const produced = mergeStatic(root, { keep: [animated], tag: 'test-batch' });
  assert.equal(produced, 2, 'one batch per shared material');
  assert.equal(root.children.length, before + 2 - 3, 'a, b and c were replaced by two merged meshes');

  const merged = root.children.filter((o) => o.name === 'test-batch');
  assert.equal(merged.length, 2);
  const green = merged.find((m) => m.material === shared);
  assert.ok(green);
  green.geometry.computeBoundingBox();
  const box = green.geometry.boundingBox;
  assert.ok(box.min.x <= -2.5 && box.max.x >= 3, 'both cubes keep their local placement');
  assert.equal(animated.parent, animatedParent, 'kept animation stays where it was');
  assert.equal(hidden.parent, root, 'invisible props are not baked into a visible batch');
  assert.equal(hidden.visible, false);
});
