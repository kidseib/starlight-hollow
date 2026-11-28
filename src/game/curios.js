// "Curious things": the scenery on each island that answers back when a child
// uses the blaster or the scanning gaze. Pure rules and copy only — the 3D lives
// in `src/world/curios.js`, so what a curio says and what it gives can be tested
// without a renderer.
//
// Design rules: nothing here can be lost, missed or failed. A leaf drift that has
// been scattered gathers again by itself, a crystal regrows, and a listening
// stone repeats its fact as often as a child wants to hear it. Sparkles are a
// small one-time hello per curio per session, never a grind.

export const CURIO_TYPES = ['leaf', 'petal', 'dust', 'mote', 'crystal', 'stone'];

/**
 * The four loose families the Leafwhisk gathers. Everything else answers a bolt
 * or the scanning gaze only. Gathering a family pays one small hello per
 * session — see `familyReward`.
 */
export const GATHER_TYPES = ['leaf', 'petal', 'dust', 'mote'];

/** What a finished gather is called, for the toast. */
export const GATHER_NAMES = { leaf: 'leaf bundle', petal: 'petal posy', dust: 'sun puff', mote: 'mote lantern' };

/** How long a scatterable curio rests before it gathers itself again, in seconds. */
export const CURIO_REGROW = { leaf: 22, petal: 20, dust: 24, mote: 26, crystal: 18 };

/** Sparkles for the first zap of a curio this session. Zero afterwards. */
export const CURIO_SPARKLES = { leaf: 3, petal: 3, dust: 2, mote: 3, crystal: 4, stone: 3 };

/** The first-time line Pip says, in the child's own words. */
export const CURIO_LINES = {
  leaf: 'Leaves everywhere! There were sparkles hiding under that drift.',
  petal: 'Petal confetti! A whole posy came out of the Leafwhisk.',
  dust: 'Sunny dust! It smells like warm stone.',
  mote: 'Glow motes! They settled into a tiny lantern.',
  crystal: 'That crystal rang like a tiny bell. I wonder what the others sing.',
};

/** What Pip says when a curio is played with again — warm, never a scold. */
export const CURIO_AGAIN = {
  leaf: 'More leaves are already gathering.',
  petal: 'The flowers are already nodding back.',
  dust: 'Fresh dust is already drifting up.',
  mote: 'The motes are already gathering again.',
  crystal: 'The crystal is humming to itself.',
};

/**
 * True nature facts for the listening stones, keyed by curio id. Short, concrete
 * and checkable — a five-year-old should be able to see or imagine each one.
 */
export const STONE_FACTS = {
  'meadow-stone': 'A snail carries its little house on its back.',
  'falls-stone': 'Water always finds its way downhill.',
  'peaks-stone': 'Crystals grow slowly, one tiny layer at a time.',
  'cove-stone': 'A seashell is a home the sea left behind.',
};

export const STONE_LINE = 'The stone hummed! It is a listening stone.';

/** Sparkles for a first zap, or none for a repeat or a listening stone. */
export function curioReward(type, seen) {
  if (seen) return 0;
  return CURIO_SPARKLES[type] ?? 0;
}

export function isGatherType(type) {
  return GATHER_TYPES.includes(type);
}

/**
 * Sparkles for the first Leafwhisk gather of a family this session. The game
 * keeps the greeted families in a Set, so two leaf drifts, or a hub drift and a
 * grove drift, still pay the leaf hello only once. Nothing is ever charged.
 */
export function familyReward(type, greeted) {
  if (!isGatherType(type)) return 0;
  const already = typeof greeted?.has === 'function' ? greeted.has(type) : (greeted ?? []).includes(type);
  return already ? 0 : CURIO_SPARKLES[type] ?? 0;
}

/** A listening stone opens when a child stands close and looks straight at it. */
export function curioScanReady(type, distance, angle) {
  return type === 'stone' && distance <= 4.6 && angle <= 0.34;
}

/** Facts are spoken, never printed as a quiz. */
export function stoneFact(id) {
  return STONE_FACTS[id] ?? 'Every stone has a story if you listen.';
}
