import test from 'node:test';
import assert from 'node:assert/strict';
import { Station } from '../src/game/station.js';

const makePad = (key) => ({
  key,
  state: 'active',
  group: { position: {} },
  setState(state) {
    this.state = state;
  },
});

function makeStation(def, keys) {
  return Object.assign(Object.create(Station.prototype), {
    def,
    pads: keys.map(makePad),
    mistakes: 0,
    active: true,
    solved: false,
    ctx: { hud: { showFeedback() {} }, audio: { pop() {} }, fx: { burst() {} } },
  });
}

const states = (station) => station.pads.map((p) => p.state);

test('first miss keeps every choice, the answer is never dimmed', () => {
  const station = makeStation({ type: 'pick', answerKey: 'circle' }, ['square', 'triangle', 'circle']);
  station._narrowChoices();
  assert.deepEqual(states(station), ['active', 'active', 'active']);
  station.mistakes = 1;
  station._narrowChoices();
  assert.deepEqual(states(station), ['active', 'active', 'active']);
  assert.equal(station.pads.find((p) => p.key === 'circle').state, 'active');
});

test('a second miss leaves the answer and one simpler choice', () => {
  const station = makeStation({ type: 'pattern', answerKey: 'triangle' }, ['square', 'triangle', 'circle']);
  station.mistakes = 2;
  station._narrowChoices();
  const active = station.pads.filter((p) => p.state === 'active');
  assert.equal(active.length, 2);
  assert.ok(active.some((p) => p.key === 'triangle'));
  assert.equal(station.pads.filter((p) => p.state === 'dim').length, 1);
});

test('wider pick signs narrow one pad at a time down to two', () => {
  const station = makeStation({ type: 'pick', answerKey: 'b' }, ['a', 'b', 'c', 'd']);
  station.mistakes = 2;
  station._narrowChoices();
  assert.equal(station.pads.filter((p) => p.state === 'active').length, 3);
  station.mistakes = 3;
  station._narrowChoices();
  assert.equal(station.pads.filter((p) => p.state === 'active').length, 2);
  assert.equal(station.pads.find((p) => p.key === 'b').state, 'active');
  station.mistakes = 9;
  station._narrowChoices();
  assert.equal(station.pads.filter((p) => p.state === 'active').length, 2);
});

test('a sign with only two choices is left alone', () => {
  const station = makeStation({ type: 'pick', answerKey: 'yes' }, ['yes', 'no']);
  station.mistakes = 5;
  station._narrowChoices();
  assert.deepEqual(states(station), ['active', 'active']);
});

test('order and memory signs keep every pad, because the order is the puzzle', () => {
  for (const type of ['sequence', 'memory']) {
    const station = makeStation({ type, answerKeys: ['a', 'b'] }, ['a', 'b', 'c', 'd']);
    station.mistakes = 4;
    station._narrowChoices();
    assert.deepEqual(states(station), ['active', 'active', 'active', 'active']);
  }
});
