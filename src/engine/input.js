// Movement, look and gadget input from mouse + keyboard, gamepads and touch.
//
// Pointer lock gives smooth first-person look; if a browser refuses it (some
// embedded frames do) we fall back to drag-to-look so the game is never
// unplayable. A gamepad is polled every frame, and the touch layer feeds the
// same three values, so every device drives exactly the same game code.

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'Enter',
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.dx = 0;
    this.dy = 0;
    this.firing = false;
    this.fireQueued = false;
    this.toolQueued = false;
    this.jumpQueued = false;
    this.locked = false;
    this.dragging = false;
    this.dragDistance = 0;
    this.enabled = false;
    this.sensitivity = 0.0021;
    this.onLockChange = null;

    // Device reporting: the last device that did something owns the legend.
    this.device = 'mouse';
    this.onDevice = null;
    this.onPause = null;
    this.onRepeat = null;

    // Touch layer fills this in: x = strafe, y = forward (pushed up is -1).
    this.touch = { x: 0, y: 0, jump: false, active: false, holding: false };
    // Gamepad state, refreshed by pollGamepad().
    this.pad = { x: 0, y: 0, jump: false, connected: false, holding: false };
    this._padPrev = new Map();

    this.pointerLockAvailable = 'requestPointerLock' in canvas;

    canvas.addEventListener('mousedown', (e) => this._onDown(e));
    window.addEventListener('mouseup', (e) => this._onUp(e));
    window.addEventListener('mousemove', (e) => this._onMove(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => this._onLockChange());
    document.addEventListener('pointerlockerror', () => {
      this.locked = false;
    });
    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup', (e) => this._onKey(e, false));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.firing = false;
      this.touch.x = 0;
      this.touch.y = 0;
      this.touch.jump = false;
      this.touch.holding = false;
      this.pad.holding = false;
    });

    canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
  }

  setDevice(next) {
    if (!next || next === this.device) return;
    this.device = next;
    this.onDevice?.(next);
  }

  _onDown(e) {
    if (!this.enabled) return;
    this.setDevice('mouse');
    if (e.button === 2) {
      // Right-click latches the other tool: the mouse's own switch.
      this.toolQueued = true;
      return;
    }
    if (e.button === 0) {
      if (!this.locked && this.pointerLockAvailable) {
        this.requestLock();
        this.dragging = true;
        this.dragDistance = 0;
      } else if (this.locked) {
        this.firing = true;
        this.fireQueued = true;
      } else {
        // Drag fallback: a short click without dragging counts as a zap.
        this.dragging = true;
        this.dragDistance = 0;
      }
    }
  }

  _onUp(e) {
    if (e.button !== 0) return;
    if (this.dragging && !this.locked && this.dragDistance < 12 && this.enabled) {
      this.fireQueued = true;
    }
    this.dragging = false;
    this.firing = false;
  }

  _onMove(e) {
    if (!this.enabled) return;
    // A real mouse movement takes the legend back to mouse, so a child who looks
    // around with the mouse is told about clicking. Touch and gamepad do not
    // produce movementX, so they never steal it back.
    if (e.movementX || e.movementY) this.setDevice('mouse');
    if (this.locked) {
      this.dx += e.movementX || 0;
      this.dy += e.movementY || 0;
    } else if (this.dragging) {
      const d = Math.hypot(e.movementX || 0, e.movementY || 0);
      this.dragDistance += d;
      this.dx += e.movementX || 0;
      this.dy += e.movementY || 0;
    }
  }

  /** First touch anywhere means the child is on a touchscreen, not a mouse. */
  _onTouchStart(e) {
    if (!this.enabled) return;
    this.setDevice('touch');
  }

  _onKey(e, down) {
    const code = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
    if (down) {
      if (MOVE_KEYS.has(code) || code.startsWith('Key')) this.setDevice('keyboard');
      // One zap per press, on the keyboard as well as the mouse.
      if (!e.repeat && (code === 'KeyE' || code === 'Enter') && !this.keys.has(code)) this.fireQueued = true;
      if (!e.repeat && code === 'KeyQ') this.toolQueued = true;
      this.keys.add(code);
    } else {
      this.keys.delete(code);
    }
  }

  _onLockChange() {
    this.locked = document.pointerLockElement === this.canvas;
    if (!this.locked) this.firing = false;
    this.onLockChange?.(this.locked);
  }

  requestLock() {
    if (!this.pointerLockAvailable) return;
    const p = this.canvas.requestPointerLock?.({ unadjustedMovement: false });
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  releaseLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // ------------------------------------------------------------ touch layer --

  /** x = strafe (-1..1), y = forward (-1..1, up is negative). */
  setTouchStick(x, y) {
    this.touch.x = Math.max(-1, Math.min(1, x));
    this.touch.y = Math.max(-1, Math.min(1, y));
  }

  addTouchLook(dx, dy) {
    this.dx += dx;
    this.dy += dy;
  }

  touchZap() {
    if (!this.enabled) return;
    this.fireQueued = true;
    this.touch.holding = true;
    this.setDevice('touch');
  }

  endTouchZap() {
    this.touch.holding = false;
  }

  touchTool() {
    if (!this.enabled) return;
    this.toolQueued = true;
    this.setDevice('touch');
  }

  consumeTool() {
    const q = this.toolQueued;
    this.toolQueued = false;
    return q;
  }

  /** True while any device is holding the zap button down (the Leafwhisk's trigger). */
  get firingHeld() {
    return this.firing || this.down('KeyE') || this.down('Enter') || this.touch.holding || this.pad.holding;
  }

  setTouchJump(held) {
    this.touch.jump = !!held;
  }

  // ------------------------------------------------------------ gamepad -----

  /**
   * Read the first connected pad through the Gamepad API. Polling is read-only,
   * so an injected pad (as used in tests) behaves exactly like a real one.
   */
  pollGamepad(dt = 0.016) {
    // Pause and "say it again" must work while the game is paused, so the pad is
    // still read then; only movement and zapping are gated on being in play.
    const active = this.enabled;
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads ? Array.from(pads).find((p) => p && p.connected !== false) : null;
    if (!pad) {
      this.pad.connected = false;
      this.pad.x = 0;
      this.pad.y = 0;
      this.pad.jump = false;
      return;
    }
    this.pad.connected = true;
    const dead = 0.24;
    const axis = (i) => {
      const v = pad.axes?.[i] ?? 0;
      return Math.abs(v) < dead ? 0 : v;
    };
    const lx = axis(0);
    const ly = axis(1);
    const rx = axis(2);
    const ry = axis(3);
    this.pad.x = lx;
    this.pad.y = ly;

    if (active && (Math.abs(lx) > 0 || Math.abs(ly) > 0 || Math.abs(rx) > 0 || Math.abs(ry) > 0)) this.setDevice('gamepad');
    // Stick look at roughly the speed of a comfortable mouse turn.
    if (active) {
      this.dx += rx * 1150 * dt;
      this.dy += ry * 760 * dt;
    }

    const pressed = (i) => !!(pad.buttons?.[i] && (pad.buttons[i].pressed || pad.buttons[i].value > 0.35));
    const edge = (i) => {
      const now = pressed(i);
      const was = this._padPrev.get(i) ?? false;
      this._padPrev.set(i, now);
      return now && !was;
    };

    // 0 = A (jump), 7 = RT and 2 = X (zap), 9 = Start (pause), 3 = Y (say again).
    this.pad.jump = active && pressed(0);
    const zap = edge(7) || edge(2);
    if (active && zap) {
      this.fireQueued = true;
      this.setDevice('gamepad');
    }
    if (active && pressed(0)) this.setDevice('gamepad');
    this.pad.holding = active && (pressed(7) || pressed(2));
    if (edge(1)) this.toolQueued = true;
    if (edge(9)) this.onPause?.();
    if (edge(3)) this.onRepeat?.();
  }

  // ------------------------------------------------------------ reading -----

  consumeLook() {
    const out = { dx: this.dx, dy: this.dy };
    this.dx = 0;
    this.dy = 0;
    return out;
  }

  consumeFire() {
    const q = this.fireQueued;
    this.fireQueued = false;
    return q;
  }

  down(code) {
    return this.keys.has(code);
  }

  /** Keyboard, thumb pad and left stick all land on the same movement value. */
  get forward() {
    const keys = (this.down('KeyW') || this.down('ArrowUp') ? 1 : 0) - (this.down('KeyS') || this.down('ArrowDown') ? 1 : 0);
    const value = keys - this.touch.y - this.pad.y;
    return Math.max(-1, Math.min(1, value));
  }

  get strafe() {
    const keys = (this.down('KeyD') ? 1 : 0) - (this.down('KeyA') ? 1 : 0);
    const value = keys + this.touch.x + this.pad.x;
    return Math.max(-1, Math.min(1, value));
  }

  get jumpHeld() {
    return this.down('Space') || this.touch.jump || this.pad.jump;
  }

  get sprint() {
    return this.down('ShiftLeft') || this.down('ShiftRight');
  }

  get turning() {
    return (this.down('ArrowRight') ? 1 : 0) - (this.down('ArrowLeft') ? 1 : 0);
  }
}
