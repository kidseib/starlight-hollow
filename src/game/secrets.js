/**
 * Hidden discoveries — the rewards for wandering off the path.
 *
 * None of these are signs. There is no prompt, no question and no counter that
 * points at them: a child finds one by going behind the market stall, around
 * the back of the Star Tree, past the far arch or to the quiet edge of an
 * island. Each one gives sparkles, a line from Pip and a small trophy that
 * appears on the Discovery Shelf in the meadow, so a find is something you can
 * walk back and look at.
 *
 * Pure data and rules: no scene, no DOM, no save.
 */

/**
 * `at` is a local offset inside its island, so the world position is
 * `zone.origin + at` with the height taken from the ground. `hidden` is the
 * phrase Pip uses when it is found, written for a child who cannot read.
 */
export const SECRETS = [
  {
    id: 'meadow-nest',
    zone: 'meadow',
    at: { x: 11.2, z: 13.9 },
    name: 'Snuggle Nest',
    trophy: 'egg',
    color: 0xffd166,
    sparkles: 10,
    clue: 'Something is humming behind Momo’s stall.',
    hidden: 'A Snuggle Nest! Someone left a warm little egg here. I will keep it safe on the shelf.',
  },
  {
    id: 'meadow-root',
    zone: 'meadow',
    at: { x: -2.8, z: -6.2 },
    name: 'Root Lantern',
    trophy: 'lantern',
    color: 0xffb95e,
    sparkles: 10,
    clue: 'The grass is brighter on the far side of the Star Tree.',
    hidden: 'A Root Lantern! It was glowing under the big tree the whole time.',
  },
  {
    id: 'meadow-chime',
    zone: 'meadow',
    at: { x: -43.5, z: 18.6 },
    name: 'Shell Chime',
    trophy: 'chime',
    color: 0x8fe8ff,
    sparkles: 10,
    clue: 'Listen near the Cove arch when the wind picks up.',
    hidden: 'A Shell Chime! It sings when the wind runs past the arch.',
  },
  {
    id: 'grove-book',
    zone: 'grove',
    at: { x: 30.5, z: -21 },
    name: 'Sleepy Storybook',
    trophy: 'book',
    color: 0xa6f2a0,
    sparkles: 10,
    clue: 'The Grove keeps a book at the quiet end of the island.',
    hidden: 'A Sleepy Storybook! The pages smell like rain and honey.',
  },
  {
    id: 'grove-mushroom',
    zone: 'grove',
    at: { x: -26.5, z: 7.5 },
    name: 'Glow Mushroom',
    trophy: 'mushroom',
    color: 0xd3b8ff,
    sparkles: 10,
    clue: 'Mushrooms like the shade on the left of the Grove.',
    hidden: 'A Glow Mushroom! It lights up when you say hello.',
  },
];

export const SECRET_IDS = SECRETS.map((s) => s.id);

export function secretById(id) {
  return SECRETS.find((s) => s.id === id) ?? null;
}

export function secretsForZone(zoneId) {
  return SECRETS.filter((s) => s.zone === zoneId);
}

/** Only ids that still exist survive a load, and each counts once. */
export function sanitizeSecrets(raw) {
  if (!Array.isArray(raw)) return [];
  const known = new Set(SECRET_IDS);
  const out = [];
  for (const id of raw) {
    if (typeof id === 'string' && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Find a secret. Finding one twice is not an error and never pays twice —
 * nothing in this game punishes a child for walking back over old ground.
 */
export function discover(found, id) {
  const list = sanitizeSecrets(found);
  const secret = secretById(id);
  if (!secret) return { ok: false, reason: 'unknown', found: list, secret: null };
  if (list.includes(id)) return { ok: false, reason: 'found', found: list, secret };
  list.push(id);
  return { ok: true, found: list, secret };
}

export function collectionStatus(found) {
  const list = sanitizeSecrets(found);
  return {
    found: list,
    count: list.length,
    total: SECRETS.length,
    complete: list.length === SECRETS.length,
    label: `${list.length}/${SECRETS.length}`,
  };
}

export function isFound(found, id) {
  return sanitizeSecrets(found).includes(id);
}

/** How the shelf reads each trophy, so the world and the tests agree. */
export const TROPHY_KINDS = ['egg', 'lantern', 'chime', 'book', 'mushroom'];
