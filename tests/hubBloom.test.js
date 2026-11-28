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

test('the hub grows step by step and never shrinks as keepsakes come home', () => {
  const seen = { lanterns: 0, pavers: 0, pennants: 0, stones: 0, rim: 0, fireflies: 0, flags: 0, blooms: 0 };
  for (let n = 0; n <= all.length; n++) {
    const bloom = hubBloom(all.slice(0, n));
    assert.equal(bloom.count, n);
    for (const key of Object.keys(seen)) {
      const value = key === 'flags' || key === 'blooms' ? bloom[key].length : bloom[key];
      assert.ok(value >= seen[key], `${key} went backwards at ${n}`);
      seen[key] = value;
    }
    assert.equal(bloom.stones <= 5, true);
    assert.equal(bloom.rim <= 9, true);
    assert.equal(bloom.fireflies <= 4, true);
    assert.equal(bloom.pavers <= 7, true);
    // The path leads a few keepsakes ahead of the far-off stones.
    if (n >= 1) assert.ok(bloom.pavers >= 1);
    if (n < 9) assert.equal(bloom.stones, 0);
    if (n < 13) assert.equal(bloom.grottoOpen, false);
  }
  assert.equal(seen.lanterns, 13);
  assert.equal(seen.pavers, 7);
  assert.equal(seen.pennants, 13);
  assert.equal(seen.stones, 5);
  assert.equal(seen.rim, 9);
  assert.equal(seen.fireflies, 4);
});

test('planters fill one keepsake at a time and complete only with their island', () => {
  const four = hubBloom(all.slice(0, 4));
  const fills = Object.values(four.fills);
  assert.equal(fills.length, 6);
  assert.ok(fills.some((f) => f > 0 && f < 1), 'a half-found island should half-fill its planter');
  assert.ok(four.blooms.length <= four.flags.length);
  const thirteen = hubBloom(all);
  assert.deepEqual(Object.values(thirteen.fills), [1, 1, 1, 1, 1, 1]);
  assert.equal(thirteen.step, 'The moonwell wakes');
  assert.equal(thirteen.veil, 0);
});

test('a hostile save cannot over-grow the staged hub', () => {
  const hostile = [...all, ...all, 'not-real', null, 3, { id: 'x' }, ...all];
  const bloom = hubBloom(hostile);
  assert.equal(bloom.count, SECRETS.length);
  assert.equal(bloom.lanterns, LANTERN_COUNT);
  assert.equal(bloom.pavers, 7);
  assert.equal(bloom.pennants, SECRETS.length);
  assert.equal(bloom.stones, 5);
  assert.equal(bloom.rim, 9);
  assert.equal(bloom.fireflies, 4);
  for (const bad of [undefined, null, 'nope', {}, 7, [], { not: 'a list' }]) {
    const safe = hubBloom(bad);
    assert.equal(safe.count, 0);
    assert.equal(safe.pavers, 0);
    assert.equal(safe.pennants, 0);
    assert.equal(safe.stones, 0);
    assert.equal(safe.rim, 0);
    assert.equal(safe.grottoOpen, false);
  }
});
