// Two tools, one pair of hands. Pure rules and copy for the tool switch and the
// Leafwhisk's suction, so the game, the HUD and the tests agree.

export const TOOLS = ['bolt', 'whisk'];

export const TOOL_INFO = {
  bolt: {
    icon: '🔮',
    name: 'Starbolt',
    line: 'The Starbolt. Zap a sign, a friend or a crystal.',
  },
  whisk: {
    icon: '🌀',
    name: 'Leafwhisk',
    line: 'The Leafwhisk! Hold zap near leaves and they will swirl right up.',
  },
};

export function nextTool(tool) {
  return tool === 'whisk' ? 'bolt' : 'whisk';
}

export function toolInfo(tool) {
  return TOOL_INFO[tool] ?? TOOL_INFO.bolt;
}

/** How far the intake reaches, and how narrow its cone is (cos of the half-angle). */
export const SUCTION_RANGE = 7.5;
export const SUCTION_COS = 0.88;

/**
 * Is this world point inside the intake? Forgiving: the cone is wide, and a
 * point just behind the nozzle still counts if it is close.
 */
export function inSuction(point, origin, direction, range = SUCTION_RANGE, cosLimit = SUCTION_COS) {
  const vx = point.x - origin.x;
  const vy = point.y - origin.y;
  const vz = point.z - origin.z;
  const distance = Math.hypot(vx, vy, vz);
  if (distance > range) return false;
  if (distance < 1.2) return true;
  const dot = (vx * direction.x + vy * direction.y + vz * direction.z) / distance;
  return dot >= cosLimit;
}

/** 1 at the nozzle, 0 at the far edge — drives the whoosh and the debris speed. */
export function suctionStrength(distance, range = SUCTION_RANGE) {
  if (distance >= range) return 0;
  return Math.max(0, Math.min(1, 1 - distance / range));
}

/** How long a drift takes to empty, in seconds of held suction. */
export const GATHER_SECONDS = 1.7;

/** Leaf bundles needed to call a drift gathered (one). */
export function gatherDone(held, needed = GATHER_SECONDS) {
  return held >= needed;
}
