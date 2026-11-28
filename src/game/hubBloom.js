// What the hub has grown because of the keepsakes found so far. Pure data so
// the rules can be tested without a scene, and so a malformed save can never
// reach the world with an impossible state.

import { SECRETS, sanitizeSecrets, progressByWorld } from './secrets.js';

/** One lantern lights for every keepsake, so the path fills up as you explore. */
export const LANTERN_COUNT = SECRETS.length;

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

/**
 * Everything the hub shows, derived only from the saved secrets list:
 * lanterns lit, island flags flying, beds bloomed, and whether the grotto woke.
 */
export function hubBloom(found) {
  const ids = sanitizeSecrets(found);
  const progress = progressByWorld(ids);
  const flags = progress.worlds.filter((w) => w.found > 0).map((w) => w.zone);
  const blooms = progress.worlds.filter((w) => w.complete).map((w) => w.zone);
  return {
    count: ids.length,
    lanterns: Math.min(LANTERN_COUNT, ids.length),
    flags,
    blooms,
    complete: ids.length === SECRETS.length,
    grottoOpen: ids.length === SECRETS.length,
    missing: Math.max(0, SECRETS.length - ids.length),
  };
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
