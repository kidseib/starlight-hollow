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

import { HOLLOW_GATES, HOLLOW_GATE_IDS } from './hollow.js';

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
    // Two finds sleep behind a small door now. The first is a curtain of
    // drifting leaves: the Leafwhisk sipping it away is the whole puzzle, and
    // the hollow behind it stays open in the save once the leaves are gone.
    gate: {
      id: 'grove-drift',
      kind: 'drift',
      at: { x: 28.4, z: -19.5 },
      teach: 'Sleepy leaves are holding the hollow shut. Hold the Leafwhisk and sip them away.',
      open: 'The leaves danced off! A hollow is open behind them.',
    },
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
  {
    id: 'falls-stone',
    zone: 'falls',
    at: { x: 34, z: 4 },
    name: 'Ripple Stone',
    trophy: 'stone',
    color: 0x8fd6ff,
    sparkles: 10,
    clue: 'Something smooth is drying in the sun, far from the falls.',
    hidden: 'A Ripple Stone! It still remembers the shape of the water.',
  },
  {
    id: 'falls-jar',
    zone: 'falls',
    at: { x: -33, z: 9 },
    name: 'Bubble Jar',
    trophy: 'jar',
    color: 0x5fe0c0,
    sparkles: 10,
    clue: 'The quiet side of the falls has a jar with something in it.',
    hidden: 'A Bubble Jar! The bubbles inside never stop climbing.',
  },
  {
    id: 'peaks-kite',
    zone: 'peaks',
    at: { x: 33, z: -8 },
    name: 'Wind Kite',
    trophy: 'kite',
    color: 0xc9a8ff,
    sparkles: 10,
    clue: 'The wind keeps tugging at something on the far ridge.',
    hidden: 'A Wind Kite! It wants to fly, so I will hold it tight.',
  },
  {
    id: 'peaks-chart',
    zone: 'peaks',
    at: { x: -34, z: -4 },
    name: 'Star Chart',
    trophy: 'chart',
    color: 0xffe08a,
    sparkles: 10,
    clue: 'Someone left a map of the night sky up here.',
    hidden: 'A Star Chart! Every star up there has a name.',
    // The second is a frost veil held by a hanging bell: one bolt rings it and
    // the veil melts, so the two gates use the two tools the child already has.
    gate: {
      id: 'peaks-frost',
      kind: 'ring',
      at: { x: -31.6, z: -3.7 },
      teach: 'A frost veil! Ring the little bell with a bolt and watch it melt.',
      open: 'Ding! The frost veil melted away.',
    },
  },
  {
    id: 'words-drum',
    zone: 'words',
    at: { x: 32, z: 12 },
    name: 'Singing Drum',
    trophy: 'drum',
    color: 0xffc46b,
    sparkles: 10,
    clue: 'Listen past the singing flowers on the sunny side.',
    hidden: 'A Singing Drum! It hums when you tap it twice.',
  },
  {
    id: 'words-feather',
    zone: 'words',
    at: { x: -33, z: -9 },
    name: 'Story Feather',
    trophy: 'feather',
    color: 0xff9ec4,
    sparkles: 10,
    clue: 'A soft thing is caught in the shade at the back.',
    hidden: 'A Story Feather! It tickles when you write with it.',
  },
  {
    id: 'cove-shell',
    zone: 'cove',
    at: { x: 34, z: -6 },
    name: 'Whisper Shell',
    trophy: 'shell',
    color: 0xffd6b0,
    sparkles: 10,
    clue: 'One shell on the sand still has the sea inside it.',
    hidden: 'A Whisper Shell! Hold it up and you can hear the waves.',
  },
  {
    id: 'cove-spyglass',
    zone: 'cove',
    at: { x: -32, z: 11 },
    name: 'Little Spyglass',
    trophy: 'spyglass',
    color: 0x8fe8ff,
    sparkles: 10,
    clue: 'A pirate-small telescope is hiding by the far rocks.',
    hidden: 'A Little Spyglass! Now I can see the whole Hollow.',
  },
];

export const SECRET_IDS = SECRETS.map((s) => s.id);

/**
 * The two hollows that are not a walk-in. Each gate belongs to one secret, sits
 * on that secret's island in front of it, and opens with the one tool its
 * `kind` names — the Leafwhisk for a leaf drift, a bolt for a frost bell.
 */
export const GATES = SECRETS.filter((s) => s.gate).map((s) => ({
  ...s.gate,
  zone: s.zone,
  secretId: s.id,
}));

export const GATE_IDS = GATES.map((g) => g.id);

export function gateById(id) {
  return GATES.find((g) => g.id === id) ?? HOLLOW_GATES.find((g) => g.id === id) ?? null;
}

export function gateForSecret(secretId) {
  return GATES.find((g) => g.secretId === secretId) ?? null;
}

export function gatesForZone(zoneId) {
  return GATES.filter((g) => g.zone === zoneId);
}

/** Only known gate ids survive a load, each counted once. */
export function sanitizeGates(raw) {
  if (!Array.isArray(raw)) return [];
  const known = new Set([...GATE_IDS, ...HOLLOW_GATE_IDS]);
  const out = [];
  for (const id of raw) {
    if (typeof id === 'string' && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** Which tool opens which gate, in one place so the copy and tests agree. */
export function gateVerb(kind) {
  if (kind === 'drift') return 'whisk';
  if (kind === 'ring') return 'bolt';
  return null;
}

/** A hollow behind a shut gate cannot be walked into yet. */
export function gateBlocks(gate, opened) {
  if (!gate) return false;
  return !sanitizeGates(opened).includes(gate.id);
}

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
export const TROPHY_KINDS = [
  'egg', 'lantern', 'chime', 'book', 'mushroom',
  'stone', 'jar', 'kite', 'chart', 'drum', 'feather', 'shell', 'spyglass',
];

/** The islands that hide things, in the order a child meets them. */
export const WORLD_IDS = ['meadow', 'grove', 'falls', 'peaks', 'words', 'cove'];

export const WORLD_LABELS = {
  meadow: 'Sunbeam Meadow',
  grove: 'Letterleaf Grove',
  falls: 'Tallybrook Falls',
  peaks: 'Pattern Peaks',
  words: 'Storysong Glade',
  cove: 'Pebblecount Cove',
};

/**
 * How many are hidden on each island, so a display can show "1 of 2 here"
 * without reading: every world needs the same shape of answer.
 */
export function worldTotals() {
  const out = {};
  for (const zone of WORLD_IDS) out[zone] = SECRETS.filter((s) => s.zone === zone).length;
  return out;
}

/** Per-world progress plus the grand total, all from the same sanitised list. */
export function progressByWorld(found) {
  const list = sanitizeSecrets(found);
  const worlds = WORLD_IDS.map((zone) => {
    const secrets = SECRETS.filter((s) => s.zone === zone);
    const hits = secrets.filter((s) => list.includes(s.id));
    return { zone, label: WORLD_LABELS[zone], found: hits.length, total: secrets.length, complete: secrets.length > 0 && hits.length === secrets.length, secrets };
  }).filter((w) => w.total > 0);
  return { worlds, total: list.length, of: SECRETS.length };
}

/** The first thing found on an island, used as that island's shelf keepsake. */
export function firstFoundInWorld(found, zone) {
  const list = sanitizeSecrets(found);
  return SECRETS.find((s) => s.zone === zone && list.includes(s.id)) ?? null;
}
