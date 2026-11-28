// "Curious things": the scenery on each island that answers back when a child
// uses the blaster or the scanning gaze. Pure rules and copy only — the 3D lives
// in `src/world/curios.js`, so what a curio says and what it gives can be tested
// without a renderer.
//
// Design rules: nothing here can be lost, missed or failed. A leaf drift that has
// been scattered gathers again by itself, a crystal regrows, and a listening
// stone repeats its fact as often as a child wants to hear it. Sparkles are a
// small one-time hello per curio per session, never a grind.

export const CURIO_TYPES = ['leaf', 'crystal', 'stone'];

/** How long a scatterable curio rests before it gathers itself again, in seconds. */
export const CURIO_REGROW = { leaf: 22, crystal: 18 };

/** Sparkles for the first zap of a curio this session. Zero afterwards. */
export const CURIO_SPARKLES = { leaf: 3, crystal: 4, stone: 3 };

/** The first-time line Pip says, in the child's own words. */
export const CURIO_LINES = {
  leaf: 'Leaves everywhere! There were sparkles hiding under that drift.',
  crystal: 'That crystal rang like a tiny bell. I wonder what the others sing.',
};

/** What Pip says when a curio is played with again — warm, never a scold. */
export const CURIO_AGAIN = {
  leaf: 'More leaves are already gathering.',
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

/** A listening stone opens when a child stands close and looks straight at it. */
export function curioScanReady(type, distance, angle) {
  return type === 'stone' && distance <= 4.6 && angle <= 0.34;
}

/** Facts are spoken, never printed as a quiz. */
export function stoneFact(id) {
  return STONE_FACTS[id] ?? 'Every stone has a story if you listen.';
}
