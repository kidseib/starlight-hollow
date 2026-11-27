import * as THREE from 'three';
import { makeSprite } from '../world/textures.js';
import { damp, clamp } from '../engine/utils.js';

const BOLT_SPEED = 40;
const BOLT_LIFE = 1.6;

export class Blaster {
  constructor(camera, scene, audio, fx) {
    this.camera = camera;
    this.scene = scene;
    this.audio = audio;
    this.fx = fx;
    this.cooldown = 0;
    this.recoil = 0;
    this.bobPhase = 0;
    this.rainbow = false;
    this.hue = 0;
    this.projectiles = [];
    this.onHit = null;
    this.groundFn = () => 0;

    this.group = new THREE.Group();
    camera.add(this.group);
    this._buildModel();
    this._buildMuzzle();
  }

  _buildModel() {
    const cream = new THREE.MeshStandardMaterial({ color: 0xfff4dd, roughness: 0.5, metalness: 0.15 });
    const teal = new THREE.MeshStandardMaterial({ color: 0x5fd6c4, roughness: 0.35, metalness: 0.3, emissive: 0x1f7a6c, emissiveIntensity: 0.35 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.3, metalness: 0.35, emissive: 0xffab33, emissiveIntensity: 0.55 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), cream);
    body.scale.set(1, 0.82, 2.0);
    body.position.z = -0.16;
    this.group.add(body);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.44, 12), teal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.005, -0.48);
    this.group.add(barrel);

    const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.022, 8, 20), gold);
    muzzleRing.position.set(0, 0.005, -0.68);
    this.group.add(muzzleRing);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.12), cream);
    grip.position.set(0, -0.16, 0.02);
    grip.rotation.x = -0.35;
    this.group.add(grip);

    const gripBand = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 6, 16), gold);
    gripBand.rotation.x = Math.PI / 2;
    gripBand.position.set(0, -0.06, 0.0);
    this.group.add(gripBand);

    this.gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), gold);
    this.gem.position.set(0, 0.15, -0.18);
    this.group.add(this.gem);

    const gemGlow = makeSprite(0xffd166, 0.5, 0.5);
    gemGlow.position.copy(this.gem.position);
    this.group.add(gemGlow);
    this.gemGlow = gemGlow;

    // side fins
    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.24), teal);
      fin.position.set(s * 0.14, 0.01, -0.2);
      fin.rotation.z = s * 0.16;
      this.group.add(fin);
    }

    this.group.position.set(0.34, -0.33, -0.58);
    this.group.rotation.set(0, 0.04, 0);
    this.group.scale.setScalar(0.86);
    this.group.traverse((o) => {
      o.frustumCulled = false;
    });

    this.boltGeo = new THREE.SphereGeometry(0.11, 10, 8);
    this.boltMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  }

  _buildMuzzle() {
    this.muzzle = makeSprite(0xfff2b0, 0.1, 0);
    this.muzzle.position.set(0, 0.005, -0.78);
    this.group.add(this.muzzle);
  }

  /** Momo's Rainbow Blaster: every zap gets the next colour of the rainbow. */
  setRainbow(on) {
    this.rainbow = !!on;
    if (!this.rainbow) {
      this.boltMat.color.set(0xfff2b0);
      this.gemGlow.material.color.set(0xffd166);
    }
  }

  fire(targetPosition = null, targetRef = null) {
    if (this.cooldown > 0) return false;
    this.cooldown = 0.24;
    this.recoil = 1;
    if (this.rainbow) {
      this.hue = (this.hue + 0.11) % 1;
      // Set the hue in sRGB so the bolts read as a real rainbow instead of a
      // washed-out pastel after the renderer's tone mapping.
      const color = new THREE.Color().setHSL(this.hue, 0.92, 0.55, THREE.SRGBColorSpace);
      this.boltMat.color.copy(color);
      this.gemGlow.material.color.copy(color);
    }
    this.audio?.zap();

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const start = this.camera
      .getWorldPosition(new THREE.Vector3())
      .add(forward.clone().multiplyScalar(0.65))
      .add(right.clone().multiplyScalar(0.2))
      .add(up.clone().multiplyScalar(-0.1));

    const mesh = new THREE.Mesh(this.boltGeo, this.boltMat);
    mesh.position.copy(start);
    const glow = makeSprite(0xffe9a8, 1.1, 0.95);
    mesh.add(glow);
    this.scene.add(mesh);

    const dir = targetPosition
      ? targetPosition.clone().sub(start).normalize()
      : forward.clone();

    this.projectiles.push({
      mesh,
      glow,
      vel: dir.multiplyScalar(targetPosition ? BOLT_SPEED * 0.8 : BOLT_SPEED),
      speed: targetPosition ? BOLT_SPEED * 0.8 : BOLT_SPEED,
      target: targetPosition ? targetPosition.clone() : null,
      ref: targetRef,
      life: BOLT_LIFE,
      turn: targetPosition ? 14 : 0,
    });
    return true;
  }

  update(dt, time) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.recoil = damp(this.recoil, 0, 11, dt);

    const idle = Math.sin(time * 1.2) * 0.006;
    const idle2 = Math.sin(time * 1.9 + 1.2) * 0.008;
    this.group.position.set(0.34 + idle, -0.33 + idle2 - this.recoil * 0.03, -0.58 + this.recoil * 0.08);
    this.group.rotation.set(-this.recoil * 0.3, 0.04 + Math.sin(time * 0.7) * 0.012, -this.recoil * 0.1);

    this.gem.rotation.y += dt * 1.8;
    this.gemGlow.material.opacity = 0.35 + Math.sin(time * 3) * 0.12;

    this.muzzle.material.opacity = damp(this.muzzle.material.opacity, this.recoil > 0.75 ? 0.95 : 0, 18, dt);
    this.muzzle.scale.setScalar(0.15 + this.recoil * 0.55);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      if (p.target) {
        const desired = p.target.clone().sub(p.mesh.position).normalize().multiplyScalar(p.speed);
        p.vel.lerp(desired, clamp(1 - Math.exp(-p.turn * dt), 0, 1));
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.glow.material.opacity = 0.75 + Math.sin(p.life * 30) * 0.2;

      let remove = false;
      if (p.target && p.mesh.position.distanceTo(p.target) < 0.95) {
        this.onHit?.(p.ref ?? p.target, p.mesh.position.clone());
        remove = true;
      }
      if (!remove && p.mesh.position.y < this.groundFn(p.mesh.position.x, p.mesh.position.z) + 0.05) {
        this.fx?.burst(p.mesh.position, { color: 0xffe9a8, count: 6, speed: 2.4, life: 0.5, size: 0.4 });
        remove = true;
      }
      if (!remove && (p.life <= 0 || p.mesh.position.distanceTo(this.camera.position) > 70)) {
        remove = true;
      }
      if (remove) {
        this.scene.remove(p.mesh);
        p.glow.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  setVisible(v) {
    this.group.visible = v;
  }
}
