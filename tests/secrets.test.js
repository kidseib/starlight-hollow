import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SECRETS,
  SECRET_IDS,
  TROPHY_KINDS,
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
