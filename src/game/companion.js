import * as THREE from 'three';
import { makeSprite } from '../world/textures.js';
import { damp, clamp } from '../engine/utils.js';

/**
 * Pip — the little firefly bird who travels with the explorer.
 *
 * Pip is not decoration: he drifts along beside the camera, cheers when a sign
 * is solved, droops when a zap misses, and — if a child stands still for a
 * while with nothing to do — floats towards the nearest unsolved sign and says
 * where to go. Everything he does is readable by a child who cannot read.
 */

const FOLLOW_FORWARD = 2.35;
const FOLLOW_RIGHT = -0.62;
const FOLLOW_DOWN = 0.3;

export class Companion {
  constructor({ scene, camera, audio, fx }) {
    this.scene = scene;
    this.camera = camera;
    this.audio = audio;
    this.fx = fx;

    this.group = new THREE.Group();
    this.group.renderOrder = 4;
    this.position = new THREE.Vector3();
    this.initialised = false;

    this.cheer = 0;
    this.sad = 0;
    this.flutter = 0;
    this.point = null;
    this.pointTimer = 0;
    this.pointCooldown = 0;
    this.chirpT = 0;

    this._build();
    scene.add(this.group);
  }

  _build() {
    const cream = new THREE.MeshStandardMaterial({ color: 0xfff7e2, roughness: 0.42, metalness: 0.04, emissive: 0xfff0c8, emissiveIntensity: 0.22 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.34, metalness: 0.12, emissive: 0xffab33, emissiveIntensity: 0.35 });
    const coral = new THREE.MeshStandardMaterial({ color: 0xff9a76, roughness: 0.5, metalness: 0.05 });
    const ink = new THREE.MeshBasicMaterial({ color: 0x26314f });
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), cream);
    body.scale.set(1, 0.94, 1.08);
    this.group.add(body);
    this.body = body;

    // a cheeky little crest
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 8), gold);
    crest.position.set(0, 0.185, 0.015);
    crest.rotation.x = -0.3;
    this.group.add(crest);

    // tail star, swept up and back
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 5), gold);
    tail.position.set(0, 0.03, 0.2);
    tail.rotation.x = Math.PI / 2 + 0.55;
    this.group.add(tail);

    // beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 7), coral);
    beak.position.set(0, -0.01, -0.2);
    beak.rotation.x = -Math.PI / 2;
    this.group.add(beak);

    // big friendly eyes
    this.eyes = [];
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), white);
      eye.position.set(s * 0.072, 0.045, -0.14);
      eye.scale.set(1, 1, 0.72);
      this.group.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), ink);
      pupil.position.set(s * 0.078, 0.042, -0.185);
      this.group.add(pupil);
      this.eyes.push({ eye, pupil, side: s });
    }

    // wings: swept-back little feathered discs on shoulder pivots
    this.wings = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.15, 0.04, 0.03);
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), gold);
      wing.scale.set(0.52, 0.16, 1.35);
      wing.position.set(s * 0.07, 0, 0.07);
      wing.rotation.y = s * -0.3;
      pivot.add(wing);
      this.group.add(pivot);
      this.wings.push({ pivot, side: s });
    }

    // warm firefly glow
    this.glow = makeSprite(0xfff2b0, 1.2, 0.32);
    this.group.add(this.glow);
    this.glowInner = makeSprite(0xffe9a8, 0.72, 0.5);
    this.group.add(this.glowInner);

    this.group.scale.setScalar(0.95);
    this.group.traverse((o) => {
      o.frustumCulled = false;
    });
  }

  /** Put Pip exactly beside the camera (used after a portal jump). */
  snap() {
    this._computeTarget(0);
    this.position.copy(this.target);
    this.group.position.copy(this.position);
    this.initialised = true;
  }

  _computeTarget(speed) {
    const cam = this.camera;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);

    const trail = clamp(speed / 6, 0, 1);
    const target = cam.position
      .clone()
      .addScaledVector(forward, FOLLOW_FORWARD + trail * 1.15)
      .addScaledVector(right, FOLLOW_RIGHT + trail * 0.15)
      .add(new THREE.Vector3(0, -FOLLOW_DOWN - trail * 0.12, 0));

    if (this.point) {
      // Swing round to the sign's side of the view but stay close enough to
      // stay on screen — a companion that flies out of frame helps nobody.
      const toSign = this.point.clone().sub(cam.position);
      toSign.y = 0;
      if (toSign.lengthSq() > 0.04) {
        toSign.normalize();
        const yawF = Math.atan2(-forward.x, -forward.z);
        const yawS = Math.atan2(-toSign.x, -toSign.z);
        let d = yawS - yawF;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const ang = clamp(d, -0.3, 0.3);
        const dir = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        target.copy(cam.position).addScaledVector(dir, 2.85).add(new THREE.Vector3(0, 0.26, 0));
      }
    }

    this.target = target;
    return target;
  }

  canPoint() {
    return this.pointCooldown <= 0 && !this.point;
  }

  /**
   * Float towards a place of interest and chatter about it for a few seconds.
   * Returns false when Pip is busy or still cooling down.
   */
  pointAt(worldPos) {
    if (!this.canPoint()) return false;
    this.point = worldPos.clone();
    this.pointTimer = 6.5;
    this.pointCooldown = 30;
    this.flutter = 1;
    this.audio?.chime?.(2);
    this.fx?.burst(this.position.clone(), { color: 0xfff2b0, count: 10, speed: 2.2, life: 0.7, size: 0.4 });
    return true;
  }

  celebrate() {
    this.cheer = 1.35;
    this.flutter = 1;
    this.audio?.chime?.(3);
    this.fx?.burst(this.position.clone(), { color: 0xfff2b0, count: 16, speed: 3.2, life: 0.9, size: 0.5, gravity: -2 });
  }

  droop() {
    this.sad = 1.1;
    this.flutter = 0.25;
  }

  update(dt, time, player) {
    const planar = player ? Math.hypot(player.velocity.x, player.velocity.z) : 0;
    if (!this.initialised) this.snap();

    this.cheer = Math.max(0, this.cheer - dt);
    this.sad = Math.max(0, this.sad - dt);
    this.flutter = Math.max(0, this.flutter - dt * 1.4);
    this.pointCooldown = Math.max(0, this.pointCooldown - dt);
    if (this.pointTimer > 0) {
      this.pointTimer -= dt;
      if (this.pointTimer <= 0) this.point = null;
    }

    this._computeTarget(planar);
    const stiff = this.point ? 2.6 : 4.2;
    this.position.x = damp(this.position.x, this.target.x, stiff, dt);
    this.position.y = damp(this.position.y, this.target.y, stiff * 1.15, dt);
    this.position.z = damp(this.position.z, this.target.z, stiff, dt);

    // hover bob + a happy hop while celebrating
    const bob = Math.sin(time * 2.4) * 0.045;
    const hop = this.cheer > 0 ? Math.abs(Math.sin(this.cheer * 9)) * 0.12 : 0;
    const sadDip = this.sad > 0 ? -0.1 * Math.sin(clamp(this.sad, 0, 1) * Math.PI) : 0;
    this.group.position.set(this.position.x, this.position.y + bob + hop + sadDip, this.position.z);

    // always look back at the explorer (the model's beak points down -Z)
    const look = this.camera.position.clone();
    look.y = this.group.position.y;
    if (look.distanceTo(this.group.position) > 0.2) {
      this.group.lookAt(look);
      this.group.rotateY(Math.PI);
    }

    // wing flap, faster when moving or cheering
    const flapSpeed = 9 + planar * 2.4 + this.flutter * 8 + (this.cheer > 0 ? 10 : 0);
    const flap = Math.sin(time * flapSpeed) * (0.55 + this.flutter * 0.5);
    for (const w of this.wings) {
      w.pivot.rotation.z = w.side * (0.52 + flap * 0.5) - (this.sad > 0 ? w.side * 0.85 : 0);
      w.pivot.rotation.x = Math.sin(time * flapSpeed * 0.5) * 0.16;
    }

    // happy spin while celebrating
    if (this.cheer > 0) {
      const t = 1 - this.cheer / 1.35;
      this.group.rotation.y += dt * (6 + (1 - t) * 10);
    }

    // eyes: blink-ish squint when sad, wide when cheering
    const squint = this.sad > 0 ? 0.55 : 1 + (this.cheer > 0 ? 0.1 : 0);
    for (const e of this.eyes) e.eye.scale.set(1, squint, 0.72);

    // firefly glow breathes; brighter when pointing the way
    const glow = 0.32 + Math.sin(time * 2.1) * 0.06 + (this.point ? 0.3 : 0) + (this.cheer > 0 ? 0.25 : 0);
    this.glow.material.opacity = damp(this.glow.material.opacity, glow, 6, dt);
    this.glowInner.material.opacity = damp(this.glowInner.material.opacity, glow + 0.15, 6, dt);
    this.glow.scale.setScalar(1.5 + Math.sin(time * 2.1) * 0.06 + (this.point ? 0.5 : 0));

    // a soft trail sparkle when he is leading the way
    if (this.point && this.pointTimer > 0.6) {
      this.chirpT -= dt;
      if (this.chirpT <= 0) {
        this.chirpT = 0.42;
        this.fx?.burst(this.position.clone(), { color: 0xfff2b0, count: 3, speed: 0.8, life: 0.8, size: 0.3, gravity: 0.6 });
      }
    }

    // the companion is always with you, even when its island is culled
    this.group.visible = true;
  }
}
