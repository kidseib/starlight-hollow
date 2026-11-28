import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUNDLE_KINDS,
  BUNDLE_NAMES,
  ARBOR_MAX,
  ARBOR_HINT,
  ARBOR_EMPTY,
  ARBOR_LINES,
  ARBOR_TOAST,
  ARBOR_WAKE_TOAST,
  WISH_MAX,
  MOON_PHASES,
  moonPhase,
  phaseLight,
  WISH_CAP,
  WISH_TOAST,
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
  allSpotsFull,
  arborStage,
  wishCount,
  giveArbor,
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

test('the arbor takes every gift once the bed is full and never turns one away', () => {
  assert.equal(allSpotsFull(emptyGifts()), false);
  assert.equal(allSpotsFull({ petal: GIFT_MAX, dust: GIFT_MAX - 1, mote: GIFT_MAX }), false);
  assert.equal(allSpotsFull({ petal: GIFT_MAX, dust: GIFT_MAX, mote: GIFT_MAX }), true);

  // Six lights, one per gift, the sixth waking the arbor.
  let bundles = { petal: 9, dust: 0, mote: 0 };
  let arbor = 0;
  let wishes = 0;
  for (let i = 1; i <= ARBOR_MAX; i++) {
    const step = giveArbor(bundles, arbor, wishes, 'petal');
    assert.equal(step.ok, true);
    assert.equal(step.reason, null);
    assert.equal(step.bundles.petal, 9 - i);
    assert.equal(step.arbor, i);
    assert.equal(step.stage, i);
    assert.equal(step.woke, i === ARBOR_MAX);
    assert.equal(step.wish, false);
    bundles = step.bundles;
    arbor = step.arbor;
    wishes = step.wishes;
  }
  assert.equal(arbor, ARBOR_MAX);

  // Awake, every further gift is a wish: still spent, still accepted, one firefly.
  const first = giveArbor(bundles, arbor, wishes, 'petal');
  assert.equal(first.ok, true);
  assert.equal(first.wish, true);
  assert.equal(first.woke, false);
  assert.equal(first.arbor, ARBOR_MAX);
  assert.equal(first.wishes, 1);
  assert.equal(first.bundles.petal, 9 - ARBOR_MAX - 1);

  // Past the last firefly it still accepts, still spends, and the moon moves.
  const full = giveArbor({ petal: 1 }, ARBOR_MAX, WISH_MAX, 'petal');
  assert.equal(full.ok, true);
  assert.equal(full.wish, true);
  assert.equal(full.wishes, WISH_MAX + 1);
  assert.equal(full.bundles.petal, 0);
  assert.notEqual(moonPhase(full.wishes).id, moonPhase(WISH_MAX).id, 'a gift past the flock still changes the moon');
  const capped = giveArbor({ petal: 1 }, ARBOR_MAX, WISH_CAP, 'petal');
  assert.equal(capped.ok, true);
  assert.equal(capped.wishes, WISH_CAP, 'a wild wish count is clamped, never refused');

  // An empty basket is the only refusal, and it changes nothing.
  const empty = giveArbor({ petal: 0 }, 2, 3, 'petal');
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, 'empty');
  assert.equal(empty.arbor, 2);
  assert.equal(empty.wishes, 3);
  assert.equal(empty.bundles.petal, 0);

  const unknown = giveArbor({ petal: 1 }, 1, 0, 'crystal');
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unknown');
  assert.equal(unknown.bundles.petal, 1);

  // Caller objects are never mutated.
  const start = { petal: 2 };
  giveArbor(start, 0, 0, 'petal');
  assert.equal(start.petal, 2);
});

test('arbor state is clamped, and its copy is distinct from every other line', () => {
  assert.equal(arborStage(-4), 0);
  assert.equal(arborStage('3'), 3);
  assert.equal(arborStage(99), ARBOR_MAX);
  assert.equal(arborStage(undefined), 0);
  assert.equal(wishCount(99), 99, 'wishes keep counting so the moon can keep turning');
  assert.equal(wishCount(5000), WISH_CAP, 'a wild wish count is clamped');
  assert.equal(wishCount('2.9'), 2);
  assert.equal(wishCount(null), 0);

  assert.equal(ARBOR_LINES.length, ARBOR_MAX);
  for (const line of ARBOR_LINES) assert.ok(line.length > 12 && line.endsWith('.'), 'an arbor line is a spoken sentence');
  assert.ok(ARBOR_LINES[ARBOR_MAX - 1].includes('awake'), 'the last arbor line is the waking');
  for (const [text, icon] of [ARBOR_TOAST, ARBOR_WAKE_TOAST, WISH_TOAST]) {
    assert.ok(text.length > 4 && icon, 'each arbor toast has words and an icon');
  }
  for (const phase of MOON_PHASES) {
    assert.ok(phase.line.length > 20 && /[.!]$/.test(phase.line), 'a phase line reads as a spoken sentence');
    assert.ok(Number.isFinite(phase.glow) && Number.isFinite(phase.bright), 'a phase has a glow and a brightness');
    assert.ok(Number.isFinite(phase.lamp) && phase.scale > 0.9 && phase.scale < 1.2, 'a phase has a lamp colour and a readable size');
    assert.ok(phase.lamp % 256 < 128, 'the lanterns stay honey-warm in every phase');
    assert.ok(phase.angle >= 0 && phase.angle <= Math.PI, 'a phase light comes from somewhere on the near-to-far arc');
    if (phase.id === 'new') assert.ok(phase.angle > 2.8, 'the new moon is almost fully dark');
  }
  assert.equal(moonPhase(0).id, 'full', 'the arbor wakes under a full moon');
  assert.equal(new Set(MOON_PHASES.map((p) => p.glow)).size, MOON_PHASES.length, 'every phase has its own halo colour');

  // The lit face is carved by the geometry: the fractions must fall in order, and
  // exactly half at the quarter, so the shape a child sees is a real phase.
  const litByPhase = Object.fromEntries(MOON_PHASES.map((p) => [p.id, phaseLight(p.angle).lit]));
  assert.equal(litByPhase.full, 1);
  assert.ok(litByPhase.gibbous > 0.6 && litByPhase.gibbous < 0.95, 'a gibbous moon is more than half lit');
  assert.ok(Math.abs(litByPhase.half - 0.5) < 0.002, 'the half moon is exactly half lit');
  assert.ok(litByPhase.crescent > 0.3 && litByPhase.crescent < 0.45, 'a crescent is a clear lit sliver, not a hairline');
  assert.ok(litByPhase.new < 0.02, 'the new moon shows almost no lit face');
  assert.equal(phaseLight(0).z, 1, 'the full moon is lit from the viewer');
  assert.equal(phaseLight(Math.PI).z, -1, 'the new moon is lit from behind');
  assert.notEqual(moonPhase(1).glow, moonPhase(0).glow, 'the first wish changes the lantern colour');
  assert.equal(moonPhase(MOON_PHASES.length).id, moonPhase(0).id, 'the moon cycles back to full');
  assert.ok(MOON_PHASES.includes(moonPhase(WISH_CAP + 5)), 'a wild value still picks a real phase');
  assert.equal(moonPhase(-8).id, 'full', 'junk falls back to the full moon');
  assert.ok(ARBOR_HINT.includes('arbor'), 'the hint names the arbor');
  assert.ok(ARBOR_EMPTY.includes('arbor') && ARBOR_EMPTY.length > 30, 'the empty pointer names the arbor and every family');

  const flat = [...ARBOR_LINES, ...MOON_PHASES.map((p) => p.line), ...BUNDLE_KINDS.flatMap((k) => GIFT_LINES[k])];
  assert.equal(new Set(flat).size, flat.length, 'no shared copy between garden lines');
});
