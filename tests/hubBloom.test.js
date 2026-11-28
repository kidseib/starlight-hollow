import test from 'node:test';
import assert from 'node:assert/strict';
import { SECRETS, sanitizeSecrets } from '../src/game/secrets.js';
import { hubBloom, grottoLoot, grottoWhisper, LANTERN_COUNT, GROTTO } from '../src/game/hubBloom.js';

const all = SECRETS.map((s) => s.id);

test('a fresh save grows nothing and the grotto stays asleep', () => {
  const bloom = hubBloom([]);
  assert.equal(bloom.count, 0);
  assert.equal(bloom.lanterns, 0);
  assert.deepEqual(bloom.flags, []);
  assert.deepEqual(bloom.blooms, []);
  assert.equal(bloom.grottoOpen, false);
  assert.equal(bloom.missing, LANTERN_COUNT);
  assert.equal(bloom.missing, 13);
  assert.equal(grottoLoot({ found: [] }).canTake, false);
});

test('partial progress lights one lantern per keepsake and flies a flag per island', () => {
  const seven = all.slice(0, 7);
  const bloom = hubBloom(seven);
  assert.equal(bloom.count, 7);
  assert.equal(bloom.lanterns, 7);
  assert.equal(bloom.grottoOpen, false);
  assert.ok(bloom.flags.length >= 3);
  // The meadow and the grove are fully collected in the first seven.
  assert.ok(bloom.blooms.includes('meadow'));
  assert.ok(bloom.blooms.includes('grove'));
  assert.ok(!bloom.blooms.includes('cove'));
  assert.match(grottoWhisper(seven), /6 keepsakes/);
});

test('all thirteen wakes the grotto, and only then can the chest be taken', () => {
  const bloom = hubBloom(all);
  assert.equal(bloom.lanterns, LANTERN_COUNT);
  assert.equal(bloom.flags.length, 6);
  assert.equal(bloom.blooms.length, 6);
  assert.equal(bloom.complete, true);
  assert.equal(bloom.grottoOpen, true);
  assert.equal(bloom.missing, 0);
  assert.equal(grottoWhisper(all), null);
  assert.equal(grottoLoot({ found: all }).canTake, true);
  assert.equal(grottoLoot({ found: all, taken: true }).canTake, false);
  assert.equal(GROTTO.sparkles > 0, true);
  assert.equal(typeof GROTTO.line, 'string');
});

test('junk, duplicates and unknown ids never inflate the hub or throw', () => {
  const dirty = ['meadow-nest', 'not-real', null, 42, { id: 'falls-stone' }, 'meadow-nest'];
  const bloom = hubBloom(dirty);
  assert.equal(bloom.count, 1);
  assert.equal(bloom.lanterns, 1);
  assert.equal(bloom.grottoOpen, false);
  assert.deepEqual(sanitizeSecrets(dirty), ['meadow-nest']);
  // A save with a mangled list still produces a usable hub.
  for (const bad of [undefined, null, 'nope', {}, 7]) {
    const safe = hubBloom(bad);
    assert.equal(safe.count, 0);
    assert.equal(safe.grottoOpen, false);
  }
});

test('eleven is not enough: the grotto needs every keepsake', () => {
  const eleven = all.slice(0, 11);
  assert.equal(hubBloom(eleven).grottoOpen, false);
  assert.match(grottoWhisper(eleven), /2 keepsakes/);
  const twelve = all.slice(0, 12);
  assert.match(grottoWhisper(twelve), /One more keepsake/);
});

test('lanterns never exceed the keepsakes that exist', () => {
  const bloom = hubBloom(all);
  assert.equal(bloom.lanterns, SECRETS.length);
  assert.equal(LANTERN_COUNT, SECRETS.length);
});
