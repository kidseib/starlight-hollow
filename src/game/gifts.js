// What the Leafwhisk gathers is not just confetti: petal posies, sun puffs and
// mote lanterns go into a basket, and Pip's garden on the meadow path has a
// place for each family. Pure rules and copy only — the 3D lives in
// `src/world/garden.js`, so what a gift does and what Pip says can be tested
// without a renderer.
//
// Design rules: giving is always optional. A full garden refuses nothing a
// child owns (the bundle stays in the basket), an empty basket is answered with
// a friendly pointer rather than a scold, and none of this touches sparkles,
// stars, keepsakes or the grotto.
//
// When all three spots are full, the garden's bare Moon Arbor takes over: the
// same aim-and-zap puts a light on it, six lights wake it and a moon moth moves
// in, and every gift after that becomes a wish that calls one more firefly. The
// arbor never refuses a gift for being too full, so gathering never ends in a
// basket with nowhere to go.

/** The families that leave something in the basket. Leaves stay a celebration. */
export const BUNDLE_KINDS = ['petal', 'dust', 'mote'];

export const BUNDLE_NAMES = {
  petal: 'petal posy',
  dust: 'sun puff',
  mote: 'mote lantern',
};

export const BUNDLE_ICONS = { petal: '🌸', dust: '🌾', mote: '✨' };

/** How many of a family a basket may hold. A save with more is clamped. */
export const BASKET_MAX = 9;

/** Each spot in Pip's garden takes one bundle per stage. */
export const GIFT_MAX = 3;

/** The arbor behind the bed takes six lights before it wakes. */
export const ARBOR_MAX = 6;

/** Waking the arbor invites a moon moth; each wish after that calls a firefly. */
export const WISH_MAX = 12;

export const ARBOR_NAME = 'the Moon Arbor';

export const GIFT_SPOTS = [
  { kind: 'petal', id: 'posy-bed', label: 'the posy bed', icon: '🌸', max: GIFT_MAX },
  { kind: 'dust', id: 'sun-bowl', label: 'the sun bowl', icon: '🌾', max: GIFT_MAX },
  { kind: 'mote', id: 'lantern-post', label: 'the lantern post', icon: '✨', max: GIFT_MAX },
];

export function emptyBundles() {
  return Object.fromEntries(BUNDLE_KINDS.map((k) => [k, 0]));
}

export function emptyGifts() {
  return Object.fromEntries(BUNDLE_KINDS.map((k) => [k, 0]));
}

const count = (value, max) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, n);
};

/** A save can carry junk; only real families with sane counts survive. */
export function sanitizeBundles(raw) {
  const out = emptyBundles();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const kind of BUNDLE_KINDS) out[kind] = count(raw[kind], BASKET_MAX);
  return out;
}

export function sanitizeGifts(raw) {
  const out = emptyGifts();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const kind of BUNDLE_KINDS) out[kind] = count(raw[kind], GIFT_MAX);
  return out;
}

export function basketTotal(bundles) {
  const safe = sanitizeBundles(bundles);
  return BUNDLE_KINDS.reduce((sum, kind) => sum + safe[kind], 0);
}

/** True when the spot can take another bundle. */
export function canGive(gifts, kind) {
  if (!BUNDLE_KINDS.includes(kind)) return false;
  return sanitizeGifts(gifts)[kind] < GIFT_MAX;
}

/** True once every spot has all it wants, so gifts move to the arbor. */
export function allSpotsFull(gifts) {
  const placed = sanitizeGifts(gifts);
  return BUNDLE_KINDS.every((kind) => placed[kind] >= GIFT_MAX);
}

const clamp = (value, max) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, n);
};

export function arborStage(raw) {
  return clamp(raw, ARBOR_MAX);
}

export function wishCount(raw) {
  return clamp(raw, WISH_MAX);
}

/**
 * Spend one bundle on the Moon Arbor, which never turns a gift away. Before it
 * wakes each gift hangs one light (`stage` 1..`ARBOR_MAX`, the last one `woke`);
 * after that each gift is a `wish` that calls another firefly. Returns fresh
 * objects, and an empty basket is still the only refusal.
 */
export function giveArbor(bundles, arbor, wishes, kind) {
  const shelf = sanitizeBundles(bundles);
  const stage = arborStage(arbor);
  const lights = wishCount(wishes);
  const base = { bundles: shelf, arbor: stage, wishes: lights, stage, woke: false, wish: false };
  if (!BUNDLE_KINDS.includes(kind)) return { ...base, ok: false, reason: 'unknown' };
  if (shelf[kind] <= 0) return { ...base, ok: false, reason: 'empty' };
  shelf[kind] -= 1;
  if (stage < ARBOR_MAX) {
    const next = stage + 1;
    return {
      ok: true, reason: null, bundles: shelf, arbor: next, wishes: lights,
      stage: next, woke: next === ARBOR_MAX, wish: false,
    };
  }
  return {
    ok: true, reason: null, bundles: shelf, arbor: stage,
    wishes: Math.min(WISH_MAX, lights + 1), stage, woke: false, wish: true,
  };
}

/**
 * Spend one bundle at Pip's garden. Returns fresh objects rather than mutating,
 * so the caller decides when to save. `reason` is 'empty' (nothing in the
 * basket) or 'full' (that spot has all it wants) when nothing is spent.
 */
export function giveGift(bundles, gifts, kind) {
  const shelf = sanitizeBundles(bundles);
  const placed = sanitizeGifts(gifts);
  if (!BUNDLE_KINDS.includes(kind)) {
    return { ok: false, reason: 'unknown', bundles: shelf, gifts: placed, stage: 0 };
  }
  if (placed[kind] >= GIFT_MAX) {
    return { ok: false, reason: 'full', bundles: shelf, gifts: placed, stage: placed[kind] };
  }
  if (shelf[kind] <= 0) {
    return { ok: false, reason: 'empty', bundles: shelf, gifts: placed, stage: placed[kind] };
  }
  shelf[kind] -= 1;
  placed[kind] += 1;
  return { ok: true, reason: null, bundles: shelf, gifts: placed, stage: placed[kind] };
}

/** What Pip says as each spot fills. Index 0 is the first gift. */
export const GIFT_LINES = {
  petal: [
    'A posy for my garden! It smells like the grove.',
    'Another posy — a butterfly came to see.',
    'The last posy! My little bed is a flower cloud.',
  ],
  dust: [
    'A sun puff! The bowl is warm now.',
    'More sunshine — the coals are glowing.',
    'The bowl is full of summer. I could nap here.',
  ],
  mote: [
    'A lantern for my post! It glows like the cove.',
    'Two lanterns — I can see the whole path.',
    'Three lanterns! My garden is a little constellation.',
  ],
};

/** Warm, never a scold: the spot is full and nothing is taken. */
export const GIFT_FULL = {
  petal: 'My flower bed is bursting already! Keep that posy for another day.',
  dust: 'The sun bowl is full of summer. Save that puff for later.',
  mote: 'Every hook on my post has a lantern. That one can stay in your basket.',
};

/** Pointers, not failures: where to find the family a child is missing. */
export const GIFT_EMPTY = {
  petal: 'The posy bed wants petals. The grove grows windflowers the Leafwhisk can gather.',
  dust: 'The sun bowl wants a sun puff. The falls and the peaks have dusty vents to whisk.',
  mote: 'The lantern post wants a glow lantern. The words cliffs and the cove have mote perches.',
};

export const GIFT_TOAST = {
  petal: ['Posy planted!', '🌸'],
  dust: ['The bowl is warm!', '🌾'],
  mote: ['Lantern hung!', '✨'],
};

/** The first bundle a session is announced, so a child knows where it goes. */
export const BASKET_HINT = {
  petal: 'A petal posy for my basket! Take it to my garden on the meadow path.',
  dust: 'A warm sun puff! My garden bowl would love that.',
  mote: 'A glowing mote lantern! My garden post has room for it.',
};

/** Spoken once when the last spot fills, so the arbor is never a secret. */
export const ARBOR_HINT =
  'My garden is full! Look at the bare arbor behind it — one more gift and it will wake.';

/** What Pip says as the arbor takes each light, then the line when it wakes. */
export const ARBOR_LINES = [
  'A light for the arbor! It has been waiting for someone to fill it.',
  'Two little lights. The arbor is waking up.',
  'Halfway! I can hear the arbor humming.',
  'Four lights! The moths are watching from the trees.',
  'One more light and the whole arbor will be glowing.',
  'The Moon Arbor is awake! A moon moth has come to live with us.',
];

/** An empty basket at the arbor: any family will do, so say so. */
export const ARBOR_EMPTY =
  'The arbor loves any bundle — a posy, a sun puff or a mote lantern. Gather one and come back.';

export const ARBOR_TOAST = ['A light for the arbor!', '🌙'];
export const ARBOR_WAKE_TOAST = ['The Moon Arbor is awake!', '🦋'];
export const WISH_TOAST = ['A wish for the arbor!', '🌠'];

/** After it wakes, the arbor keeps taking gifts as wishes, one firefly each. */
export const WISH_LINES = [
  'A wish for the arbor! The moon moth carries it up.',
  'Another wish — a firefly came to keep it.',
  'The arbor is full of little lights. There is always room for one more.',
];

/** A spot's stored stage, for the world and the HUD. */
export function giftStage(gifts, kind) {
  return sanitizeGifts(gifts)[kind] ?? 0;
}
