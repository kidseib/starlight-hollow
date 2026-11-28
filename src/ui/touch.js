// Touch controls: a thumb pad for walking and two big buttons for zapping and
// jumping, plus drag-to-look anywhere on the world. It feeds the same Input
// values the keyboard and gamepad fill in, so nothing in the game knows which
// device is in use.

import { wantsTouchPad } from '../game/controls.js';

export class TouchControls {
  constructor({ input, coarsePointer = false }) {
    this.input = input;
    this.coarsePointer = coarsePointer;
    this.stickPointer = null;
    this.lookPointer = null;
    this.lookX = 0;
    this.lookY = 0;

    const host = document.getElementById('ui') ?? document.body;
    this.root = document.createElement('div');
    this.root.id = 'touch-ui';
    this.root.className = 'hidden';
    this.root.innerHTML = `
      <div id="touch-stick" role="presentation"><div id="touch-knob"></div></div>
      <div id="touch-actions">
        <button id="touch-jump" type="button" class="touch-btn">Jump</button>
        <button id="touch-zap" type="button" class="touch-btn is-primary">Zap</button>
      </div>
    `;
    host.appendChild(this.root);

    this.stick = this.root.querySelector('#touch-stick');
    this.knob = this.root.querySelector('#touch-knob');
    this.zapBtn = this.root.querySelector('#touch-zap');
    this.jumpBtn = this.root.querySelector('#touch-jump');

    this._bindStick();
    this._bindButtons();
    this._bindLook();
  }

  _bindStick() {
    const radius = 34;
    const move = (e) => {
      const rect = this.stick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (e.clientX - cx) / radius;
      let dy = (e.clientY - cy) / radius;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      this.knob.style.transform = `translate(${dx * radius}px, ${dy * radius}px)`;
      this.input.setTouchStick(dx, dy);
      this.input.setDevice('touch');
    };
    const end = () => {
      this.stickPointer = null;
      this.knob.style.transform = 'translate(0px, 0px)';
      this.input.setTouchStick(0, 0);
    };
    this.stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.stickPointer = e.pointerId;
      this.stick.setPointerCapture?.(e.pointerId);
      move(e);
    });
    this.stick.addEventListener('pointermove', (e) => {
      if (this.stickPointer !== e.pointerId) return;
      e.preventDefault();
      move(e);
    });
    this.stick.addEventListener('pointerup', end);
    this.stick.addEventListener('pointercancel', end);
    this.stick.addEventListener('lostpointercapture', end);
  }

  _bindButtons() {
    this.zapBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.input.touchZap();
    });
    const hold = (held) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.input.setDevice('touch');
      this.input.setTouchJump(held);
      this.jumpBtn.classList.toggle('is-held', held);
    };
    this.jumpBtn.addEventListener('pointerdown', hold(true));
    this.jumpBtn.addEventListener('pointerup', hold(false));
    this.jumpBtn.addEventListener('pointercancel', hold(false));
    this.jumpBtn.addEventListener('pointerleave', hold(false));
  }

  /** Drag on the world to look; a tap still counts as a zap elsewhere. */
  _bindLook() {
    const canvas = this.input.canvas;
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' || e.target !== canvas) return;
      if (!this.input.enabled) return;
      this.input.setDevice('touch');
      this.lookPointer = e.pointerId;
      this.lookX = e.clientX;
      this.lookY = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (this.lookPointer !== e.pointerId) return;
      const dx = e.clientX - this.lookX;
      const dy = e.clientY - this.lookY;
      this.lookX = e.clientX;
      this.lookY = e.clientY;
      this.input.addTouchLook(dx * 1.7, dy * 1.7);
    });
    const end = (e) => {
      if (this.lookPointer !== e.pointerId) return;
      this.lookPointer = null;
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  setVisible(visible) {
    this.root.classList.toggle('hidden', !visible);
    this.root.classList.toggle('shown', visible);
  }

  syncForDevice(device) {
    this.setVisible(wantsTouchPad(device, this.coarsePointer));
  }
}
