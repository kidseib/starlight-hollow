import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVICES, CONTROL_LEGENDS, legendFor, deviceFromEvent, wantsTouchPad } from '../src/game/controls.js';

test('every device has its own legend naming the right controls', () => {
  assert.deepEqual(DEVICES, ['keyboard', 'mouse', 'touch', 'gamepad']);
  const shorts = new Set();
  for (const device of DEVICES) {
    const legend = legendFor(device);
    assert.equal(legend.id, device);
    assert.ok(legend.short.length > 8, `${device} legend is too terse`);
    shorts.add(legend.short);
  }
  assert.equal(shorts.size, DEVICES.length, 'two devices share the same legend');
});

test('the legend tells a child the right thing for each device', () => {
  assert.match(legendFor('keyboard').short, /WASD/);
  assert.match(legendFor('keyboard').short, /E zap/);
  assert.match(legendFor('mouse').short, /click zap/);
  assert.match(legendFor('touch').short, /Thumb pad/);
  assert.match(legendFor('gamepad').short, /RT zap/);
  assert.equal(legendFor('touch').repeatKey, null, 'touch has no keyboard repeat key');
  assert.equal(legendFor('gamepad').repeatKey, null);
  assert.equal(legendFor('keyboard').repeatKey, 'R');
  assert.equal(legendFor('mouse').repeatKey, 'R');
  assert.equal(legendFor('nonsense').id, 'keyboard', 'an unknown device falls back to a real legend');
});

test('the last thing a child touched decides the device', () => {
  assert.equal(deviceFromEvent({ pointerType: 'touch' }), 'touch');
  assert.equal(deviceFromEvent({ pointerType: 'mouse' }), 'mouse');
  assert.equal(deviceFromEvent({ kind: 'gamepad' }), 'gamepad');
  assert.equal(deviceFromEvent({ kind: 'keyboard' }), 'keyboard');
  assert.equal(deviceFromEvent({}), null);
});

test('the thumb pad only appears where it is usable', () => {
  assert.equal(wantsTouchPad('touch'), true);
  assert.equal(wantsTouchPad('mouse'), false);
  assert.equal(wantsTouchPad('keyboard'), false);
  assert.equal(wantsTouchPad('gamepad'), false);
  assert.equal(wantsTouchPad('mouse', true), false, 'a coarse pointer does not override an explicit mouse');
});

test('no legend asks a child to read a keyboard they do not have', () => {
  for (const device of ['touch', 'gamepad']) {
    const legend = CONTROL_LEGENDS[device];
    assert.doesNotMatch(legend.short, /WASD|click|arrows/);
  }
});
