// Mouse + keyboard input. Pointer lock gives smooth first-person look; if a
// browser refuses it (some embedded frames do) we fall back to drag-to-look so
// the game is never unplayable.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.dx = 0;
    this.dy = 0;
    this.firing = false;
    this.fireQueued = false;
    this.locked = false;
    this.dragging = false;
    this.dragDistance = 0;
    this.enabled = false;
    this.sensitivity = 0.0021;
    this.onLockChange = null;
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
    });
  }

  _onDown(e) {
    if (!this.enabled) return;
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

  _onKey(e, down) {
    const code = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
    if (down) this.keys.add(code);
    else this.keys.delete(code);
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

  get forward() {
    return (this.down('KeyW') || this.down('ArrowUp') ? 1 : 0) - (this.down('KeyS') || this.down('ArrowDown') ? 1 : 0);
  }

  get strafe() {
    return (this.down('KeyD') ? 1 : 0) - (this.down('KeyA') ? 1 : 0);
  }

  get jumpHeld() {
    return this.down('Space');
  }

  get sprint() {
    return this.down('ShiftLeft') || this.down('ShiftRight');
  }

  get turning() {
    return (this.down('ArrowRight') ? 1 : 0) - (this.down('ArrowLeft') ? 1 : 0);
  }
}
