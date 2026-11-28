import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SECRETS,
  SECRET_IDS,
  TROPHY_KINDS,
  WORLD_IDS,
  progressByWorld,
  worldTotals,
  firstFoundInWorld,
  secretById,
  secretsForZone,
  sanitizeSecrets,
  discover,
  collectionStatus,
  isFound,
} from '../src/game/secrets.js';

test('there are at least three hidden secrets, spread over the hub and a world', () => {
  assert.ok(SECRETS.length >= 3);
  assert.equal(new Set(SECRET_IDS).size, SECRETS.length, 'ids must be unique');
  const zones = new Set(SECRETS.map((s) => s.zone));
  assert.ok(zones.has('meadow'), 'the hub needs its own secrets');
  assert.ok([...zones].some((z) => z !== 'meadow'), 'a themed world needs at least one');
  assert.ok(secretsForZone('meadow').length >= 2);
});

test('every secret is a real reward with a readable payoff', () => {
  for (const secret of SECRETS) {
    assert.ok(secret.name && secret.hidden && secret.clue, `${secret.id} needs words for a child`);
    assert.ok(TROPHY_KINDS.includes(secret.trophy), `${secret.id} needs a trophy the shelf can build`);
    assert.ok(Number.isInteger(secret.sparkles) && secret.sparkles > 0, `${secret.id} must pay sparkles`);
    assert.ok(Number.isInteger(secret.color));
    assert.ok(Number.isFinite(secret.at.x) && Number.isFinite(secret.at.z));
  }
  // Each trophy is used once, so the shelf reads as five different things.
  assert.equal(new Set(SECRETS.map((s) => s.trophy)).size, SECRETS.length);
  assert.equal(new Set(SECRETS.map((s) => s.name)).size, SECRETS.length);
});

test('secrets are placed off the middle of their island, not on the landing spot', () => {
  for (const secret of SECRETS) {
    const distance = Math.hypot(secret.at.x, secret.at.z);
    assert.ok(distance > 6, `${secret.id} is too close to the centre to feel hidden`);
    assert.ok(distance < 55, `${secret.id} would fall off the island`);
  }
});

test('finding one pays once, and never punishes walking over it again', () => {
  let found = [];
  const first = discover(found, 'meadow-nest');
  assert.equal(first.ok, true);
  assert.deepEqual(first.found, ['meadow-nest']);
  assert.equal(first.secret.name, 'Snuggle Nest');
  const again = discover(first.found, 'meadow-nest');
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'found');
  assert.deepEqual(again.found, ['meadow-nest'], 'a second visit changes nothing');
  const nonsense = discover(first.found, 'moon-base');
  assert.equal(nonsense.ok, false);
  assert.equal(nonsense.reason, 'unknown');
  found = first.found;
  assert.equal(isFound(found, 'meadow-nest'), true);
  assert.equal(isFound(found, 'grove-book'), false);
});

test('the collection reads as a legible count and completes only at the end', () => {
  assert.deepEqual(collectionStatus([]), { found: [], count: 0, total: SECRETS.length, complete: false, label: `0/${SECRETS.length}` });
  let found = [];
  for (const secret of SECRETS) found = discover(found, secret.id).found;
  const status = collectionStatus(found);
  assert.equal(status.count, SECRETS.length);
  assert.equal(status.complete, true);
  assert.equal(status.label, `${SECRETS.length}/${SECRETS.length}`);
  const partial = collectionStatus(found.slice(0, -1));
  assert.equal(partial.complete, false);
});

test('a save cannot invent secrets, duplicate them or break the shelf', () => {
  assert.deepEqual(sanitizeSecrets(null), []);
  assert.deepEqual(sanitizeSecrets('meadow-nest'), []);
  assert.deepEqual(sanitizeSecrets(['moon-base', 42, null]), []);
  assert.deepEqual(sanitizeSecrets(['grove-book', 'grove-book']), ['grove-book']);
  const cleaned = sanitizeSecrets(['grove-book', 'nope', 'meadow-root', 'grove-book']);
  assert.deepEqual(cleaned, ['grove-book', 'meadow-root']);
  assert.ok(cleaned.every((id) => secretById(id)));
});

test('the shelf shows exactly what was found, in a stable order', () => {
  const found = sanitizeSecrets(['meadow-chime', 'grove-mushroom']);
  assert.deepEqual(found, ['meadow-chime', 'grove-mushroom']);
  const order = SECRET_IDS.filter((id) => found.includes(id));
  assert.deepEqual(order, ['meadow-chime', 'grove-mushroom'], 'the shelf places them by authored order');
});

test('every world that hides something hides at least two, and none sit on the path', () => {
  const byWorld = {};
  for (const secret of SECRETS) (byWorld[secret.zone] ??= []).push(secret);
  for (const zone of WORLD_IDS) {
    assert.ok(byWorld[zone], `${zone} has no secrets`);
    assert.ok(byWorld[zone].length >= 2, `${zone} hides fewer than two`);
    for (const secret of byWorld[zone]) {
      // A child collects sparkles along the landing path (x ~ 0, z 18..46), so
      // nothing may sit within 10 m of that stretch, and nothing may sit on the
      // island's centre where the return portal is.
      const dx = secret.at.x;
      const dz = secret.at.z < 18 ? 18 - secret.at.z : secret.at.z > 46 ? secret.at.z - 46 : 0;
      assert.ok(Math.hypot(dx, dz) > 10, `${secret.id} is too close to the path`);
      assert.ok(Math.hypot(secret.at.x, secret.at.z) > 6, `${secret.id} is on the island's centre`);
    }
  }
  assert.equal(Object.keys(byWorld).length, WORLD_IDS.length);
});

test('per-world progress adds up to the grand total and marks finished islands', () => {
  const everything = SECRETS.map((s) => s.id);
  const all = progressByWorld(everything);
  assert.equal(all.total, SECRETS.length);
  assert.equal(all.of, SECRETS.length);
  assert.equal(all.worlds.length, WORLD_IDS.length);
  assert.ok(all.worlds.every((w) => w.complete && w.found === w.total));
  assert.equal(all.worlds.reduce((n, w) => n + w.found, 0), SECRETS.length);

  const oneWorld = progressByWorld(SECRETS.filter((s) => s.zone === 'falls').map((s) => s.id));
  assert.equal(oneWorld.total, 2);
  const falls = oneWorld.worlds.find((w) => w.zone === 'falls');
  assert.equal(falls.found, 2);
  assert.equal(falls.complete, true);
  assert.equal(oneWorld.worlds.find((w) => w.zone === 'meadow').found, 0);

  // Unknown ids and junk never inflate a count or throw.
  const dirty = progressByWorld(['falls-stone', 'not-a-real-secret', null, 42, 'falls-stone']);
  assert.equal(dirty.total, 1);
  assert.equal(dirty.worlds.find((w) => w.zone === 'falls').found, 1);
});

test('an island shows its first find as the keepsake and knows its own total', () => {
  const totals = worldTotals();
  assert.deepEqual(Object.keys(totals).sort(), [...WORLD_IDS].sort());
  assert.ok(Object.values(totals).every((n) => n >= 2));
  assert.equal(totals.meadow, 3);

  assert.equal(firstFoundInWorld([], 'cove'), null);
  const last = SECRETS.filter((s) => s.zone === 'cove').at(-1).id;
  assert.equal(firstFoundInWorld([last], 'cove').id, last);
  const both = SECRETS.filter((s) => s.zone === 'cove').map((s) => s.id);
  assert.equal(firstFoundInWorld(both, 'cove').id, SECRETS.find((s) => s.zone === 'cove').id);
  assert.equal(firstFoundInWorld(['grove-mushroom'], 'cove'), null);
});

test('every trophy kind has its own shape and every secret uses a real one', () => {
  assert.equal(new Set(TROPHY_KINDS).size, TROPHY_KINDS.length);
  for (const secret of SECRETS) assert.ok(TROPHY_KINDS.includes(secret.trophy), secret.id);
});
