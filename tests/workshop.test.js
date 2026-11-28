import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ORNAMENTS,
  SHARD_IDS,
  ORNAMENT_COUNT,
  ornamentById,
  workshopStatus,
  collectShard,
  canPlace,
  place,
  isComplete,
  shardSpot,
} from '../src/game/workshop.js';
import { SHOP_ITEMS, purchase } from '../src/game/shop.js';
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

const fakeZone = (id) => ({
  id,
  radius: 58,
  spawn: { x: 0, z: 32 },
  portals: [{ x: 0, z: 34 }],
  stations: [
    { x: -12, z: 4 },
    { x: 12, z: 4 },
  ],
});

test('the workshop has six ornaments: five hidden shards and one market gift', () => {
  assert.equal(ORNAMENT_COUNT, 6);
  assert.equal(ORNAMENTS.length, 6);
  assert.equal(new Set(ORNAMENTS.map((item) => item.id)).size, 6);
  assert.equal(new Set(ORNAMENTS.map((item) => item.shape)).size, 6);
  assert.equal(SHARD_IDS.length, 5);
  for (const item of ORNAMENTS) {
    assert.ok(item.name && item.line && item.placeLine, `${item.id} needs spoken lines`);
    assert.ok(Number.isInteger(item.color));
    if (item.market) assert.ok(item.price > 0, 'the market ornament needs a price');
    else assert.ok(item.zone, `${item.id} needs a hiding place`);
  }
  // Each hidden shard sits on a different island.
  assert.equal(new Set(ORNAMENTS.filter((o) => o.zone).map((o) => o.zone)).size, 5);
});

test('the market sells the Sky Lantern, and buying it makes it hangable', () => {
  const lantern = SHOP_ITEMS.find((item) => item.shape === 'lantern');
  assert.ok(lantern, 'Momo must stock the workshop ornament');
  assert.equal(lantern.id, 'lantern');
  assert.equal(lantern.price, ornamentById('lantern').price);
  assert.equal(workshopStatus({ owned: [] }).find((o) => o.id === 'lantern').held, false);
  assert.equal(workshopStatus({ owned: ['lantern'] }).find((o) => o.id === 'lantern').held, true);
  assert.equal(workshopStatus({ owned: ['magnet'] }).find((o) => o.id === 'lantern').held, false);
  // Buying it costs sparkles and never touches the shard pouch.
  const bought = purchase({ owned: ['magnet'], sparkles: 200 }, 'lantern');
  assert.equal(bought.ok, true);
  assert.deepEqual(bought.owned, ['magnet', 'lantern']);
  assert.equal(bought.sparkles, 110);
});

test('a shard can only be picked up once and never from the market list', () => {
  const first = collectShard({ shards: [], placed: [] }, 'star');
  assert.equal(first.ok, true);
  assert.deepEqual(first.shards, ['star']);
  assert.equal(first.item.zone, 'grove');

  const again = collectShard({ shards: first.shards, placed: [] }, 'star');
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'collected');
  assert.deepEqual(again.shards, ['star']);

  const market = collectShard({ shards: [], placed: [] }, 'lantern');
  assert.equal(market.ok, false);
  assert.equal(market.reason, 'unknown');

  const nonsense = collectShard({ shards: [], placed: [] }, 'dragon');
  assert.equal(nonsense.ok, false);
});

test('placing needs the ornament in hand, and only one per hook', () => {
  const empty = canPlace({ shards: [], placed: [], owned: [] }, 'star');
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, 'missing');

  const held = canPlace({ shards: ['star'], placed: [], owned: [] }, 'star');
  assert.equal(held.ok, true);

  const placedOnce = place({ shards: ['star'], placed: [], owned: [] }, 'star');
  assert.equal(placedOnce.ok, true);
  assert.deepEqual(placedOnce.placed, ['star']);
  assert.equal(placedOnce.complete, false);
  // The pouch still shows the shape, nothing is lost.
  assert.deepEqual(placedOnce.item.id, 'star');

  const twice = place({ shards: ['star'], placed: ['star'], owned: [] }, 'star');
  assert.equal(twice.ok, false);
  assert.equal(twice.reason, 'placed');
  assert.deepEqual(twice.placed, ['star']);
});

test('the market ornament can be hung without any shard', () => {
  const result = place({ shards: [], placed: [], owned: ['lantern'] }, 'lantern');
  assert.equal(result.ok, true);
  assert.deepEqual(result.placed, ['lantern']);
  const blocked = place({ shards: [], placed: [], owned: [] }, 'lantern');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'missing');
});

test('the set completes only when all six shapes are on the tree', () => {
  let state = { shards: [...SHARD_IDS], placed: [], owned: ['lantern'] };
  const order = ['lantern', 'shell', 'bell', 'moon', 'flower', 'star'];
  order.forEach((id, index) => {
    const result = place(state, id);
    assert.equal(result.ok, true, `${id} should be placeable`);
    assert.deepEqual(result.placed, order.slice(0, index + 1));
    assert.equal(result.complete, index === order.length - 1);
    state = { shards: state.shards, placed: result.placed, owned: state.owned };
  });
  assert.equal(isComplete(state.placed), true);
  assert.equal(isComplete(state.placed.slice(0, 5)), false);
  assert.deepEqual(workshopStatus({ ...state }).map((o) => o.state), [
    'placed', 'placed', 'placed', 'placed', 'placed', 'placed',
  ]);
});

test('each island hides its shard clear of the landing spot and the signs', () => {
  for (const zoneId of ['grove', 'falls', 'peaks', 'words', 'cove']) {
    const zone = fakeZone(zoneId);
    const spot = shardSpot(zone);
    const distance = Math.hypot(spot.x, spot.z);
    assert.ok(distance < zone.radius * 0.85, `${zoneId} shard must stay on the island`);
    assert.ok(distance > zone.radius * 0.4, `${zoneId} shard must not sit in the middle`);
    assert.ok(Math.hypot(spot.x - zone.spawn.x, spot.z - zone.spawn.z) > 10, `${zoneId} shard is too close to the arrival arch`);
    for (const station of zone.stations) {
      assert.ok(Math.hypot(spot.x - station.x, spot.z - station.z) > 12, `${zoneId} shard crowds a sign`);
    }
  }
});

test('shard pouch and ornaments survive a save and reload', () => {
  writeSave({ sparkles: 5, shards: ['star', 'moon', 'star', 3, null], placed: ['moon'] });
  const loaded = loadSave();
  assert.deepEqual(loaded.shards, ['star', 'moon']);
  assert.deepEqual(loaded.placed, ['moon']);
  assert.equal(loaded.sparkles, 5);

  // A save written before the workshop existed still opens cleanly.
  writeSave({ sparkles: 7, solved: ['grove-b'] });
  const old = loadSave();
  assert.deepEqual(old.shards, []);
  assert.deepEqual(old.placed, []);
  assert.deepEqual(old.solved, ['grove-b']);
});

test('the tree reads as decorated only with the full set', () => {
  assert.equal(isComplete(ORNAMENTS.map((o) => o.id)), true);
  assert.equal(isComplete([]), false);
  assert.equal(isComplete(['star', 'moon', 'flower', 'bell', 'shell']), false);
});
