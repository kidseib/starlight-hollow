import * as THREE from 'three';
import { glyphTexture, makeSprite } from './textures.js';
import { damp } from '../engine/utils.js';

export const PAD_STATE_COLORS = {
  sleep: 0xbfa3d8,
  active: 0xffc94b,
  correct: 0x8dffd0,
  wrong: 0xff8fa3,
};

/**
 * One floating, glowing sign the child zaps with the blaster.
 * Pads always turn to face the player like friendly signposts.
 */
export class GlyphPad {
  constructor(spec, position, opts = {}) {
    this.spec = spec;
    this.key = spec.key ?? spec.text ?? (spec.count !== undefined ? String(spec.count) : spec.shape ?? '');
    this.label = spec.text ?? spec.shape ?? (spec.count !== undefined ? String(spec.count) : '');
    this.basePosition = position.clone();
    this.homeY = position.y;
    this.phase = (opts.index ?? 0) * 1.7 + (opts.seed ?? 0) * 0.7;
    this.state = 'sleep';
    this.highlighted = false;
    this.shake = 0;
    this.pop = 0;
    this.onScreenRatio = 0;

    this.group = new THREE.Group();
    this.group.position.copy(position);

    this.backing = new THREE.Mesh(
      new THREE.CircleGeometry(0.83, 44),
      new THREE.MeshBasicMaterial({ color: 0x1b2340, transparent: true, opacity: 0.55, depthWrite: false })
    );
    this.backing.position.z = 0.012;
    this.backing.renderOrder = 2;
    this.group.add(this.backing);

    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0x2f3a5e,
      roughness: 0.4,
      metalness: 0.2,
      emissive: PAD_STATE_COLORS.sleep,
      emissiveIntensity: 0.3,
    });
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.072, 8, 44), this.ringMat);
    this.ring.position.z = 0.03;
    this.group.add(this.ring);

    this.faceMat = new THREE.MeshBasicMaterial({
      map: glyphTexture(spec),
      transparent: true,
      depthWrite: false,
    });
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 1.34), this.faceMat);
    this.face.position.z = 0.06;
    this.face.renderOrder = 3;
    this.group.add(this.face);

    this.glow = makeSprite(PAD_STATE_COLORS.sleep, 3.6, 0.06);
    this.glow.position.z = -0.16;
    this.glow.renderOrder = 1;
    this.group.add(this.glow);

    this._applyState();
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state;
    if (state === 'correct') this.pop = 1;
    if (state === 'wrong') this.shake = 1;
    this._applyState();
  }

  _applyState() {
    const color = PAD_STATE_COLORS[this.state] ?? PAD_STATE_COLORS.sleep;
    this.ringMat.emissive.setHex(color);
    this.glow.material.color.setHex(color);
    this.faceMat.opacity = this.state === 'sleep' ? 0.8 : 1;
  }

  setHighlight(on) {
    this.highlighted = on;
  }

  update(dt, camera, time) {
    const g = this.group;
    g.position.y = this.homeY + Math.sin(time * 1.3 + this.phase) * 0.08;

    // Yaw-only billboard: pads stay upright but always readable.
    const dx = camera.position.x - g.position.x;
    const dz = camera.position.z - g.position.z;
    g.rotation.y = Math.atan2(dx, dz);

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 1.8);
      g.rotation.z = Math.sin(time * 46) * this.shake * 0.22;
    } else {
      g.rotation.z = Math.sin(time * 0.55 + this.phase) * 0.03;
    }

    const alive = this.state === 'active' || this.state === 'correct';
    let target = alive ? 1.02 : 0.96;
    if (this.highlighted && this.state === 'active') target = 1.16;
    if (this.state === 'correct') target += 0.08;
    target += this.pop * 0.22;
    this.pop = Math.max(0, this.pop - dt * 1.9);

    const s = damp(g.scale.x, target, 11, dt);
    g.scale.setScalar(s);

    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + this.phase);
    let glow = 0.04;
    if (this.state === 'active') glow = 0.18 + pulse * 0.16;
    if (this.state === 'correct') glow = 0.5 + pulse * 0.12;
    if (this.state === 'wrong') glow = 0.4;
    if (this.highlighted && this.state === 'active') glow += 0.22;
    this.glow.material.opacity = damp(this.glow.material.opacity, glow, 9, dt);
    this.glow.scale.setScalar(2.9 + (this.highlighted ? 0.5 : 0) + pulse * 0.12);

    const targetEmissive =
      this.state === 'active' ? 0.85 + pulse * 0.35 : this.state === 'correct' ? 1.5 : this.state === 'wrong' ? 1.2 : 0.4;
    this.ringMat.emissiveIntensity = damp(this.ringMat.emissiveIntensity, targetEmissive, 10, dt);
  }

  dispose() {
    this.group.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) {
        if (o.material.map && o.material.map !== null && o.material.map.isCanvasTexture) o.material.map.dispose();
        o.material.dispose?.();
      }
    });
  }
}
