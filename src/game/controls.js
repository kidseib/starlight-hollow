// One place that knows what a given device calls each action, so the legend on
// screen always matches the thing the child is actually holding. Pure data —
// the input layer only reports which device was used last.

export const DEVICES = ['keyboard', 'mouse', 'touch', 'gamepad'];

export const CONTROL_LEGENDS = {
  keyboard: {
    id: 'keyboard',
    label: 'Keyboard',
    move: 'W A S D',
    look: 'arrow keys',
    zap: 'E',
    jump: 'space',
    short: 'WASD move · mouse look · E zap',
    repeatKey: 'R',
  },
  mouse: {
    id: 'mouse',
    label: 'Mouse',
    move: 'W A S D',
    look: 'move the mouse',
    zap: 'click',
    jump: 'space',
    short: 'WASD move · mouse look · click zap',
    repeatKey: 'R',
  },
  touch: {
    id: 'touch',
    label: 'Touch',
    move: 'left thumb pad',
    look: 'drag on the right',
    zap: 'zap button',
    jump: 'jump button',
    short: 'Thumb pad to walk · drag to look · zap button',
    repeatKey: null,
  },
  gamepad: {
    id: 'gamepad',
    label: 'Gamepad',
    move: 'left stick',
    look: 'right stick',
    zap: 'RT',
    jump: 'A',
    short: 'Left stick walk · right stick look · RT zap',
    repeatKey: null,
  },
};

/** How a device names each action, always falling back to touch-safe defaults. */
export function legendFor(device) {
  return CONTROL_LEGENDS[device] ?? CONTROL_LEGENDS.keyboard;
}

/**
 * Which device a child is on, from the last thing they touched. A pointer event
 * is the strongest signal; keyboard and gamepad names come from the input layer.
 */
export function deviceFromEvent({ pointerType = null, kind = null } = {}) {
  if (pointerType === 'touch' || kind === 'touch') return 'touch';
  if (pointerType === 'mouse' || kind === 'mouse') return 'mouse';
  if (kind === 'gamepad') return 'gamepad';
  if (kind === 'keyboard') return 'keyboard';
  return null;
}

/** Touch controls only make sense where there is no mouse pointer to aim with. */
export function wantsTouchPad(device, coarsePointer = false) {
  return device === 'touch' || (coarsePointer && device !== 'gamepad' && device !== 'mouse' && device !== 'keyboard');
}
