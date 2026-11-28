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
  GATHER_TYPES,
  GATHER_NAMES,
  CURIO_REGROW,
  CURIO_LINES,
  CURIO_AGAIN,
  familyReward,
  isGatherType,
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

test('every themed world has loose scenery for the Leafwhisk, and each family is placed', () => {
  const gather = curios.filter((c) => GATHER_TYPES.includes(c.type));
  // The hub keeps the leaf drifts iteration 21 tuned; every themed world has at
  // least one thing the whisk can gather, so the tool is never useless away from home.
  for (const zone of ZONES) {
    const loose = gather.filter((c) => c.zone.id === zone.id);
    assert.ok(loose.length >= 1, `${zone.id} has loose scenery to gather`);
  }
  const themed = ZONES.filter((z) => z.kind !== 'hub');
  assert.ok(gather.some((c) => c.zone.kind === 'hub' && c.type === 'leaf'), 'the hub keeps its leaf drifts');
  // Five islands carry signs; Lantern Hollow is the sixth themed place, and it
  // gathers too, so the Leafwhisk has work everywhere a child can walk.
  assert.equal(themed.length, 6);
  for (const type of GATHER_TYPES) {
    assert.ok(gather.some((c) => c.type === type), `${type} is placed somewhere in the game`);
  }
  // Crystals and stones stay bolt/gaze curios: the whisk must not swallow them.
  for (const curio of curios.filter((c) => ['crystal', 'stone'].includes(c.type))) {
    assert.equal(isGatherType(curio.type), false, `${curio.id} is not gatherable`);
  }
});

test('a gathered family pays one hello per session, and families are independent', () => {
  assert.equal(familyReward('leaf', new Set()), CURIO_SPARKLES.leaf);
  assert.equal(familyReward('petal', new Set()), CURIO_SPARKLES.petal);
  assert.equal(familyReward('dust', new Set()), CURIO_SPARKLES.dust);
  assert.equal(familyReward('mote', new Set()), CURIO_SPARKLES.mote);

  // The second patch of the same family in one session pays nothing more.
  const greeted = new Set(['petal']);
  assert.equal(familyReward('petal', greeted), 0);
  // ...but a different family still gets its own small hello.
  assert.equal(familyReward('mote', greeted), CURIO_SPARKLES.mote);
  // Nothing that is not loose is ever paid by the whisk.
  assert.equal(familyReward('crystal', new Set()), 0);
  assert.equal(familyReward('stone', new Set()), 0);
  assert.equal(familyReward('nonsense', new Set()), 0);
  // A plain array works too, so the rule can be checked without a Set.
  assert.equal(familyReward('leaf', ['leaf']), 0);
  // Every gather family has a name and a first-time line.
  for (const type of GATHER_TYPES) {
    assert.ok(GATHER_NAMES[type], `${type} has a toast name`);
    assert.ok(CURIO_LINES[type], `${type} has a Pip line`);
    assert.ok(CURIO_AGAIN[type], `${type} has a gentle repeat line`);
    assert.ok((CURIO_REGROW[type] ?? 0) > 0, `${type} comes back by itself`);
  }
});
