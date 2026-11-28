import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUNDLE_KINDS,
  BUNDLE_NAMES,
  BASKET_MAX,
  GIFT_MAX,
  GIFT_SPOTS,
  GIFT_LINES,
  GIFT_FULL,
  GIFT_EMPTY,
  GIFT_TOAST,
  BASKET_HINT,
  emptyBundles,
  emptyGifts,
  sanitizeBundles,
  sanitizeGifts,
  basketTotal,
  canGive,
  giveGift,
  giftStage,
} from '../src/game/gifts.js';
import { GARDEN, ZONES } from '../src/content.js';

test('bundles and gifts start empty and survive a junk save', () => {
  assert.deepEqual(emptyBundles(), { petal: 0, dust: 0, mote: 0 });
  assert.deepEqual(emptyGifts(), { petal: 0, dust: 0, mote: 0 });
  // An old save has neither key: nothing breaks, nothing is invented.
  assert.deepEqual(sanitizeBundles(undefined), emptyBundles());
  assert.deepEqual(sanitizeGifts(null), emptyGifts());
  assert.deepEqual(sanitizeBundles({ petal: 'x', dust: -3, mote: 2.9 }), { petal: 0, dust: 0, mote: 2 });
  assert.deepEqual(sanitizeGifts({ petal: 99, dust: 1, mote: '2' }), { petal: GIFT_MAX, dust: 1, mote: 2 });
  assert.deepEqual(sanitizeBundles({ petal: 999 }), { petal: BASKET_MAX, dust: 0, mote: 0 });
  assert.deepEqual(sanitizeBundles(['petal']), emptyBundles());
  // Unknown families never appear as keys.
  assert.deepEqual(Object.keys(sanitizeGifts({ crystal: 5 })), BUNDLE_KINDS);
});

test('a gift spends exactly one bundle, and never overfills a spot', () => {
  const start = { petal: 2, dust: 0, mote: 1 };
  const first = giveGift(start, emptyGifts(), 'petal');
  assert.equal(first.ok, true);
  assert.equal(first.stage, 1);
  assert.equal(first.bundles.petal, 1);
  assert.equal(first.gifts.petal, 1);
  // The caller's objects are never mutated.
  assert.equal(start.petal, 2);

  const empty = giveGift({ petal: 0, dust: 0, mote: 0 }, emptyGifts(), 'petal');
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, 'empty');
  assert.equal(empty.bundles.petal, 0);

  const full = giveGift({ petal: 3, dust: 0, mote: 0 }, { petal: 3, dust: 0, mote: 0 }, 'petal');
  assert.equal(full.ok, false);
  assert.equal(full.reason, 'full');
  // A refused gift is never taken away.
  assert.equal(full.bundles.petal, 3);
  assert.equal(full.gifts.petal, 3);

  const unknown = giveGift({ petal: 1 }, emptyGifts(), 'crystal');
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unknown');

  // Three gifts fill a spot; the fourth is refused and keeps the bundle.
  let bundles = { petal: 5, dust: 0, mote: 0 };
  let gifts = emptyGifts();
  for (let i = 0; i < GIFT_MAX; i++) {
    const step = giveGift(bundles, gifts, 'petal');
    assert.equal(step.ok, true);
    bundles = step.bundles;
    gifts = step.gifts;
  }
  assert.equal(giftStage(gifts, 'petal'), GIFT_MAX);
  assert.equal(canGive(gifts, 'petal'), false);
  const extra = giveGift(bundles, gifts, 'petal');
  assert.equal(extra.ok, false);
  assert.equal(extra.reason, 'full');
  assert.equal(extra.bundles.petal, 2);
});

test('the three families map to three distinct spots, each with its own voice and sound cue', () => {
  assert.deepEqual(GIFT_SPOTS.map((s) => s.kind), BUNDLE_KINDS);
  assert.equal(new Set(GIFT_SPOTS.map((s) => s.id)).size, GIFT_SPOTS.length);
  for (const kind of BUNDLE_KINDS) {
    const spot = GIFT_SPOTS.find((s) => s.kind === kind);
    assert.ok(spot, `${kind} has a spot`);
    assert.equal(spot.max, GIFT_MAX);
    assert.ok(BUNDLE_NAMES[kind], `${kind} has a name`);
    assert.equal(GIFT_LINES[kind].length, GIFT_MAX, `${kind} has a line per stage`);
    for (const line of GIFT_LINES[kind]) {
      assert.ok(line.length > 10 && line.endsWith('.'), 'a gift line is a spoken sentence');
    }
    assert.ok(GIFT_FULL[kind], `${kind} has a warm full line`);
    assert.ok(GIFT_EMPTY[kind], `${kind} points at where to gather it`);
    assert.ok(GIFT_TOAST[kind][0] && GIFT_TOAST[kind][1], `${kind} has a toast and icon`);
    assert.ok(BASKET_HINT[kind], `${kind} explains the basket the first time`);
  }
  // The per-family lines are distinct: no shared copy between spots.
  const flat = BUNDLE_KINDS.flatMap((k) => GIFT_LINES[k]);
  assert.equal(new Set(flat).size, flat.length);
});

test('the basket counts only the three gift families, and the garden sits in the meadow', () => {
  assert.equal(basketTotal({ petal: 2, dust: 1, mote: 0, leaf: 9 }), 3);
  assert.equal(basketTotal(undefined), 0);
  assert.ok(!BUNDLE_KINDS.includes('leaf'), 'the hub leaf stays a celebration');
  assert.equal(GARDEN.zone, 'meadow');
  const meadow = ZONES.find((z) => z.id === GARDEN.zone);
  assert.ok(meadow, 'the garden zone exists');
  // Clear of the market, the shelf, the lantern row and every station and curio.
  const clear = (x, z, r) => Math.hypot(GARDEN.x - x, GARDEN.z - z) >= r;
  assert.ok(clear(11, 10, 6), 'clear of Momo');
  assert.ok(clear(6.4, 21.5, 5), 'clear of the discovery shelf');
  assert.ok(clear(0, 4, 8), 'clear of the Star Tree');
  assert.ok(clear(-18, -13, 8), 'clear of the grotto');
  for (const station of meadow.stations) assert.ok(clear(station.x, station.z, 6), 'clear of a sign');
  for (const curio of meadow.curios ?? []) assert.ok(clear(curio.x, curio.z, 5), 'clear of a curio');
  assert.ok(Math.hypot(GARDEN.x, GARDEN.z) < meadow.radius * 0.9, 'the garden is on the island');
});
