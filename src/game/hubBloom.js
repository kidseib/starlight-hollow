// What the hub has grown because of the keepsakes found so far. Pure data so
// the rules can be tested without a scene, and so a malformed save can never
// reach the world with an impossible state.
//
// Growth is staged rather than all-or-nothing: the path is laid a couple of
// stones at a time, each keepsake adds a pennant to the bunting, an island's
// planter fills as its own keepsakes come home, and the grotto clearing wakes
// stone by stone before the veil finally parts at thirteen.

import { SECRETS, sanitizeSecrets, progressByWorld } from './secrets.js';

/** One lantern lights for every keepsake, so the path fills up as you explore. */
export const LANTERN_COUNT = SECRETS.length;

/** Flagstones are laid two keepsakes at a time, up to a worn path of seven. */
export const PAVER_COUNT = 7;

/** The bunting swag by the bench gains one pennant per keepsake. */
export const PENNANT_COUNT = SECRETS.length;

/** Five stepping stones rise over the last five keepsakes. */
export const STONE_COUNT = 5;

/** The moonwell's rim stones wake one at a time from the fifth keepsake on. */
export const RIM_COUNT = 9;

/** Little fireflies gather at the arch over the last four keepsakes. */
export const FIREFLY_COUNT = 4;

/** Named stages, used for hints and documentation rather than for locking anything. */
export const GROWTH_STEPS = [
  { at: 0, name: 'A quiet meadow' },
  { at: 1, name: 'The first lantern' },
  { at: 4, name: 'The path is laid' },
  { at: 7, name: 'The garden fills' },
  { at: 9, name: 'The stones rise' },
  { at: 13, name: 'The moonwell wakes' },
];

/** The little grotto behind the Star Tree sleeps until every keepsake is home. */
export const GROTTO = {
  id: 'grotto',
  name: 'The Moonwell Grotto',
  local: { x: -18, z: -13 },
  radius: 5.4,
  sparkles: 30,
  line: 'The Moonwell Grotto! Look how the water holds the sky.',
  hint: 'Thirteen keepsakes woke the grotto. The moonwell kept something for you.',
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const stageIndexOf = (count) => GROWTH_STEPS.filter((s) => s.at <= count).length - 1;

/** Island names, used only for the spoken line that announces a change. */
export const WORLD_NAMES = {
  meadow: 'Sunbeam Meadow',
  grove: 'Letterleaf Grove',
  falls: 'Tallybrook Falls',
  peaks: 'Pattern Peaks',
  words: 'Storysong Glade',
  cove: 'Pebblecount Cove',
};

/** Which named stage a keepsake count is in (0 = nothing found yet). */
export function growthStageIndex(found) {
  const count = sanitizeSecrets(found).length;
  return GROWTH_STEPS.filter((s) => s.at <= count).length - 1;
}

/**
 * Everything the hub shows, derived only from the saved secrets list: lanterns
 * lit, island flags flying, beds filled and bloomed, the path laid, the bunting
 * swag, the grotto clearing and whether the grotto woke.
 */
export function hubBloom(found) {
  const ids = sanitizeSecrets(found);
  const progress = progressByWorld(ids);
  const count = ids.length;
  const flags = progress.worlds.filter((w) => w.found > 0).map((w) => w.zone);
  const blooms = progress.worlds.filter((w) => w.complete).map((w) => w.zone);
  const fills = {};
  for (const world of progress.worlds) {
    fills[world.zone] = world.total > 0 ? clamp(world.found / world.total, 0, 1) : 0;
  }
  const step = GROWTH_STEPS.filter((s) => s.at <= count).pop() ?? GROWTH_STEPS[0];
  return {
    count,
    lanterns: Math.min(LANTERN_COUNT, count),
    flags,
    blooms,
    fills,
    pavers: Math.min(PAVER_COUNT, Math.ceil(count / 2)),
    pennants: Math.min(PENNANT_COUNT, count),
    stones: Math.min(STONE_COUNT, clamp(count - (SECRETS.length - STONE_COUNT), 0, STONE_COUNT)),
    rim: Math.min(RIM_COUNT, clamp(count - 4, 0, RIM_COUNT)),
    fireflies: Math.min(FIREFLY_COUNT, clamp(count - (SECRETS.length - FIREFLY_COUNT), 0, FIREFLY_COUNT)),
    veil: count >= SECRETS.length ? 0 : clamp((count - 8) / 4, 0, 1),
    step: step.name,
    complete: count === SECRETS.length,
    grottoOpen: count === SECRETS.length,
    missing: Math.max(0, SECRETS.length - count),
  };
}

/**
 * What a finds a keepsake advances, in words and in world terms. Both arguments
 * are `hubBloom` results, so the spoken line and the geometry are read from the
 * same data and cannot disagree. Returns null when nothing grew.
 */
export function growthChange(before, after) {
  if (!before || !after || after.count <= before.count) return null;
  const kinds = [];
  const note = (kind, amount = 1) => { if (amount > 0) kinds.push({ kind, amount }); };
  if (after.grottoOpen && !before.grottoOpen) kinds.push({ kind: 'grotto', amount: 1 });
  note('lantern', after.lanterns - before.lanterns);
  note('pennant', after.pennants - before.pennants);
  note('paver', after.pavers - before.pavers);
  note('rim', after.rim - before.rim);
  note('stone', after.stones - before.stones);
  note('firefly', after.fireflies - before.fireflies);
  const flags = after.flags.filter((z) => !before.flags.includes(z));
  const blooms = after.blooms.filter((z) => !before.blooms.includes(z));
  if (flags.length) kinds.push({ kind: 'flag', amount: flags.length });
  if (blooms.length) kinds.push({ kind: 'bloom', amount: blooms.length });
  if (!kinds.length) return null;
  return {
    kinds,
    flags,
    blooms,
    stageIndex: GROWTH_STEPS.findIndex((s) => s === GROWTH_STEPS.filter((t) => t.at <= after.count).pop()),
    stageName: after.step,
    next: after,
    stageChanged: stageIndexOf(before.count) !== stageIndexOf(after.count),
    line: growthLine({
      kinds, flags, blooms, after,
      stageChanged: stageIndexOf(before.count) !== stageIndexOf(after.count),
    }),
  };
}

const KIND_LINE = {
  grotto: 'The Moonwell Grotto is awake and the veil is parting!',
  stone: 'A stepping stone rose out of the moss!',
  rim: 'A moonwell stone woke up!',
  firefly: 'Fireflies gathered at the sleeping grotto!',
  paver: 'A new flagstone is laid on the path!',
  pennant: 'A new pennant joined the bunting!',
  lantern: 'Another lamp is lit!',
};

/** The spoken line for a change: what actually grew, said plainly and briefly. */
function growthLine({ kinds, flags, blooms, after, stageChanged }) {
  const order = ['grotto', 'bloom', 'flag', 'stone', 'rim', 'firefly', 'paver', 'pennant', 'lantern'];
  const named = order.filter((kind) => kinds.some((k) => k.kind === kind)).slice(0, 2);
  const phrase = (kind) => {
    if (kind === 'bloom') return `The planter for ${WORLD_NAMES[blooms[0]] ?? 'this island'} is in full bloom!`;
    if (kind === 'flag') return `The ${WORLD_NAMES[flags[0]] ?? 'island'} flag is flying!`;
    return KIND_LINE[kind] ?? 'Something in the hollow grew!';
  };
  const parts = named.map(phrase);
  // A stage crossing already carries a second sentence, so it names one thing.
  let line = parts.slice(0, stageChanged ? 1 : 2).join(' ');
  // A gentle pointer at what is still asleep, only when a new stage begins.
  if (!after.complete && stageChanged) line += ' The far lanterns are still sleeping.';
  return line;
}

/** Whether the grotto chest still holds its treasure. */
export function grottoLoot({ found, taken } = {}) {
  const bloom = hubBloom(found);
  return {
    open: bloom.grottoOpen,
    canTake: bloom.grottoOpen && taken !== true,
    sparkles: GROTTO.sparkles,
    line: GROTTO.line,
  };
}

/** A gentle line for a child standing at a sleeping grotto, or null when open. */
export function grottoWhisper(found) {
  const bloom = hubBloom(found);
  if (bloom.grottoOpen) return null;
  if (bloom.missing === 1) return 'One more keepsake and this little door will wake up.';
  return `Something is sleeping here. ${bloom.missing} keepsakes would wake it.`;
}
