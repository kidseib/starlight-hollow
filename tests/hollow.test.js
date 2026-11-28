import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONES, ZONE_BY_ID } from '../src/content.js';
import {
  HOLLOW,
  HOLLOW_LOOT,
  HOLLOW_LOOT_IDS,
  HOLLOW_GATES,
  HOLLOW_GATE_IDS,
  hollowAwake,
  awakeLineFor,
  sanitizeHollowLoot,
  lootFor,
  lootWaiting,
} from '../src/game/hollow.js';
import { gateById, sanitizeGates, gateBlocks, SECRETS } from '../src/game/secrets.js';
import { writeSave, loadSave } from '../src/engine/save.js';

let store;
test.beforeEach(() => {
  store = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    },
  });
});

test('Lantern Hollow is a real themed place reached by walking, not by a menu', () => {
  const zone = ZONE_BY_ID[HOLLOW.zone];
  assert.ok(zone, 'the hollow must be a zone');
  assert.equal(zone.kind, 'world');
  assert.deepEqual(zone.stations, [], 'no quizzes: the hollow is pure exploration');
  assert.ok(zone.creatures.length >= 2, 'the hollow has its own life');
  const back = zone.portals.find((p) => p.to === 'meadow');
  assert.ok(back, 'the only way out is a walk back through an arch');

  const meadow = ZONE_BY_ID.meadow;
  const door = meadow.portals.find((p) => p.to === HOLLOW.zone);
  assert.ok(door, 'the meadow holds the arch');
  assert.equal(door.needs, HOLLOW.needs, 'the arch names its own wake condition');
  // The palette is its own dusk garden, not the meadow with the lights off.
  assert.notEqual(zone.palette.grassA, meadow.palette.grassA);
  assert.notEqual(zone.palette.skyTop, meadow.palette.skyTop);
});

test('the arch wakes only on a wish that was already being tracked', () => {
  assert.equal(hollowAwake({}), false);
  assert.equal(hollowAwake({ wishes: 0, hollow: false }), false);
  assert.equal(hollowAwake({ wishes: 1 }), true);
  assert.equal(hollowAwake({ wishes: 40 }), true);
  assert.equal(hollowAwake({ hollow: true }), true, 'a save that woke it stays awake');
  assert.equal(hollowAwake({ wishes: NaN }), false);
  // A legacy save has neither key, so the arch is asleep.
  writeSave({ sparkles: 12, solved: ['grove-a'] });
  const legacy = loadSave();
  assert.equal(hollowAwake({ wishes: legacy.wishes, hollow: legacy.hollow }), false);
});

test('the sleeping arch says one thing, once, and only while asleep', () => {
  assert.equal(awakeLineFor({ wishes: 0, hollow: false, told: false, awake: false }), HOLLOW.asleep);
  assert.equal(awakeLineFor({ wishes: 0, hollow: false, told: true, awake: false }), null);
  assert.equal(awakeLineFor({ wishes: 2, hollow: true, told: false, awake: true }), null);
  assert.ok(HOLLOW.wake.includes('Lantern Hollow'));
});

test('the hollow holds two prizes, one of them behind its own fern door', () => {
  assert.equal(HOLLOW_LOOT.length, 2);
  assert.equal(new Set(HOLLOW_LOOT_IDS).size, 2);
  const gated = HOLLOW_LOOT.filter((l) => l.gate);
  assert.equal(gated.length, 1);
  assert.ok(HOLLOW_GATE_IDS.includes(gated[0].gate));
  for (const loot of HOLLOW_LOOT) {
    assert.ok(loot.name && loot.line && Number.isInteger(loot.sparkles));
    assert.ok(['lamp', 'moth'].includes(loot.kind));
    assert.ok(Math.hypot(loot.x, loot.z) > 10, `${loot.id} must be off the landing path`);
  }
  assert.equal(lootFor('hollow-lantern').name, 'Moon Moth Lantern');
  assert.equal(lootFor('nope'), null);
});

test('a prize waits only while it is untaken and its door is open', () => {
  assert.equal(lootWaiting([], 'hollow-lantern', []), true);
  assert.equal(lootWaiting(['hollow-lantern'], 'hollow-lantern', []), false);
  assert.equal(lootWaiting([], 'hollow-music', []), false, 'the ferns still hide it');
  assert.equal(lootWaiting([], 'hollow-music', ['hollow-ferns']), true);
  assert.equal(lootWaiting([], 'invented', []), false);
  assert.deepEqual(sanitizeHollowLoot(['hollow-music', 'nope', 'hollow-music']), ['hollow-music']);
  assert.deepEqual(sanitizeHollowLoot('hollow-music'), []);
});

test('the fern door is a real gate that saves like the others', () => {
  const gate = gateById(HOLLOW_GATE_IDS[0]);
  assert.ok(gate, 'the hollow gate must be findable by id');
  assert.equal(gate.zone, HOLLOW.zone);
  assert.equal(gate.kind, 'drift');
  assert.equal(gateBlocks(gate, []), true);
  assert.equal(gateBlocks(gate, [gate.id]), false);
  assert.deepEqual(sanitizeGates([gate.id, 'invented', gate.id]), [gate.id]);
  // It is not one of the thirteen keepsakes' doors.
  assert.equal(SECRETS.filter((s) => s.gate).length, 2);
});

test('unlock and prizes round-trip through the save, and a legacy save stays locked', () => {
  writeSave({ sparkles: 3, wishes: 2, hollow: true, hollowLoot: ['hollow-lantern', 'nope', 'hollow-lantern'] });
  const save = loadSave();
  assert.equal(save.hollow, true);
  assert.deepEqual(save.hollowLoot, ['hollow-lantern']);
  assert.equal(save.wishes, 2);

  writeSave({ sparkles: 3 });
  const legacy = loadSave();
  assert.equal(legacy.hollow, false);
  assert.deepEqual(legacy.hollowLoot, []);
  assert.deepEqual(legacy.gates, []);
});
