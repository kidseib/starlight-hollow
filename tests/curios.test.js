import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONES } from '../src/content.js';
import {
  CURIO_TYPES,
  CURIO_SPARKLES,
  STONE_FACTS,
  curioReward,
  curioScanReady,
  stoneFact,
} from '../src/game/curios.js';

const curios = ZONES.flatMap((zone) => (zone.curios ?? []).map((curio) => ({ ...curio, zone })));

test('every island has curious things, all clear of signs, arches and the landing spot', () => {
  for (const zone of ZONES) {
    assert.ok((zone.curios ?? []).length >= 2, `${zone.id} has ${(zone.curios ?? []).length} curios`);
    for (const curio of zone.curios ?? []) {
      assert.ok(CURIO_TYPES.includes(curio.type), `${curio.id} has a known type`);
      assert.match(curio.id, new RegExp(`^${zone.id}-`), 'an id names its island');
      const clear = (point, r) => Math.hypot(curio.x - point.x, curio.z - point.z) >= r;
      assert.ok(clear(zone.spawn, 6), `${curio.id} is not on the landing spot`);
      for (const station of zone.stations) assert.ok(clear(station, 6), `${curio.id} is not inside a sign`);
      for (const portal of zone.portals) assert.ok(clear(portal, 6), `${curio.id} is not inside an arch`);
      assert.ok(Math.hypot(curio.x, curio.z) < zone.radius * 0.9, `${curio.id} is on the island`);
    }
    // Two curios must never sit on top of each other.
    const list = zone.curios ?? [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        assert.ok(Math.hypot(list[i].x - list[j].x, list[i].z - list[j].z) > 6, `${zone.id} curios are apart`);
      }
    }
  }
});

test('curio ids are unique, and every listening stone has a short, true fact', () => {
  const ids = curios.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const stone of curios.filter((c) => c.type === 'stone')) {
    const fact = STONE_FACTS[stone.id];
    assert.ok(fact, `${stone.id} has a fact`);
    assert.ok(fact.length <= 90, 'the fact is short enough to say in one breath');
    assert.ok(fact.endsWith('.'), 'a fact is a statement, not a question');
    assert.ok(!fact.includes('?'), 'never a quiz question');
    assert.equal(stoneFact(stone.id), fact);
  }
  assert.equal(stoneFact('not-a-stone'), 'Every stone has a story if you listen.');
});

test('a curio pays once, and only a close look opens a listening stone', () => {
  assert.equal(curioReward('leaf', false), CURIO_SPARKLES.leaf);
  assert.equal(curioReward('crystal', false), CURIO_SPARKLES.crystal);
  assert.equal(curioReward('stone', false), CURIO_SPARKLES.stone);
  // Nothing is paid twice, so no curio can be farmed.
  assert.equal(curioReward('leaf', true), 0);
  assert.equal(curioReward('crystal', true), 0);
  assert.equal(curioReward('stone', true), 0);
  assert.equal(curioReward('unknown', false), 0);

  assert.equal(curioScanReady('stone', 3, 0), true);
  assert.equal(curioScanReady('stone', 4.6, 0.34), true);
  assert.equal(curioScanReady('stone', 4.7, 0), false);
  assert.equal(curioScanReady('stone', 2, 0.4), false);
  assert.equal(curioScanReady('leaf', 2, 0), false);
  assert.equal(curioScanReady('crystal', 2, 0), false);
});
