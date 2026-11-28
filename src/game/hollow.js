/**
 * Lantern Hollow — the first place the Hollow hides behind a lock.
 *
 * The gate is not a purchase or a menu: it is a sleeping arch on the meadow's
 * far side, and it wakes when the child has actually played the arbor loop —
 * gathered bundles, filled Pip's garden, woken the arbor and made a wish. That
 * wish count already exists in the save, so nothing new is invented here.
 *
 * Pure data and rules: no scene, no DOM, no save.
 */

export const HOLLOW = {
  zone: 'hollow',
  name: 'Lantern Hollow',
  /** The meadow portal that leads there. Its `needs` is this same key. */
  needs: 'wish',
  /** Spoken when the arch wakes, once and only once. */
  wake: 'The sleepy arch is awake! Follow the lanterns to Lantern Hollow.',
  /** Spoken at a shut arch, once per session, as the one hint a child needs. */
  asleep: 'This arch is fast asleep. A wish for the arbor might wake it.',
  /** The HUD goal while inside, since the hollow has no signs to solve. */
  goal: '🌙 Find what the moonlight hides',
};

/**
 * The hollow's two prizes. They are not part of the thirteen keepsakes: the
 * meadow shelf, the cairns, the grotto count and the hub's growth are all keyed
 * to those thirteen, and this place is reached long after they were designed.
 * So the hollow keeps its own short list, saved as `hollowLoot`, on the same
 * rules: walk up, it is yours, it never pays twice.
 */
export const HOLLOW_LOOT = [
  {
    id: 'hollow-lantern',
    kind: 'lamp',
    x: -26,
    z: -18,
    name: 'Moon Moth Lantern',
    colour: 0xffd9a0,
    sparkles: 12,
    line: 'A Moon Moth Lantern! A moth has been keeping it warm in this quiet corner.',
  },
  {
    id: 'hollow-music',
    kind: 'moth',
    x: 24,
    z: 4,
    name: 'Ferny Music Box',
    colour: 0xa8f0e0,
    sparkles: 12,
    line: 'A Ferny Music Box! It plays a tiny song for the moths.',
    gate: 'hollow-ferns',
  },
];

export const HOLLOW_LOOT_IDS = HOLLOW_LOOT.map((l) => l.id);

/** One sleepy door of the hollow's own, opened with the Leafwhisk. */
export const HOLLOW_GATES = [
  {
    id: 'hollow-ferns',
    zone: 'hollow',
    kind: 'drift',
    x: 22.2,
    z: 2.5,
    teach: 'Sleepy ferns are holding this hollow shut. Hold the Leafwhisk and sip them away.',
    open: 'The ferns curled away! Something is humming inside.',
  },
];

export const HOLLOW_GATE_IDS = HOLLOW_GATES.map((g) => g.id);

export function sanitizeHollowLoot(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const id of raw) {
    if (typeof id === 'string' && HOLLOW_LOOT_IDS.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function lootFor(id) {
  return HOLLOW_LOOT.find((l) => l.id === id) ?? null;
}

/** Is this prize still out there, waiting? */
export function lootWaiting(loot, id, gatesOpen = []) {
  const prize = lootFor(id);
  if (!prize) return false;
  if (sanitizeHollowLoot(loot).includes(id)) return false;
  if (!prize.gate) return true;
  return Array.isArray(gatesOpen) && gatesOpen.includes(prize.gate);
}

/**
 * The wake condition, in one place. `wishes` is the saved arbor wish count and
 * `hollow` is the saved "already woke it" flag, so a resumed save stays awake
 * and a legacy save (both zero/false) stays asleep.
 */
export function hollowAwake({ wishes = 0, hollow = false } = {}) {
  if (hollow === true) return true;
  return Number.isFinite(wishes) && wishes > 0;
}

/** Should the sleeping-arch line be said right now? */
export function awakeLineFor({ wishes, hollow, told, awake }) {
  if (awake) return null;
  if (told) return null;
  return hollowAwake({ wishes, hollow }) ? null : HOLLOW.asleep;
}
