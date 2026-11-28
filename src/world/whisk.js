import * as THREE from 'three';
import { makeSprite } from './textures.js';

// The Leafwhisk: the hollow's second tool. A first-person intake with a flared
// cream nozzle, a gold rim, a spinning three-blade fan and a soft swirl of light
// when it is working. Loose leaves and dust are drawn to the mouth along a curve,
// crowd the nozzle, and the little pouch under the body swells as it fills.
//
// This class owns only the tool's own art and its debris: what may be gathered,
// what it pays and what Pip says all live in the game.

const LEAF_COLOURS = [0xc4642a, 0xd98d34, 0xa94d28, 0xe3ad3f, 0xb9702f];

function leafGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0, 0,
    -0.09, 0.03, 0.13,
    0, 0.05, 0.28,
    0.09, 0.03, 0.13,
  ]), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

const LEAF_GEO = leafGeometry();

export class Whisk {
  constructor(camera, scene, fx) {
    this.camera = camera;
    this.scene = scene;
    this.fx = fx;
    this.group = new THREE.Group();
    this.group.position.set(0.46, -0.35, -0.52);
    this.group.rotation.set(0.04, 0.56, -0.06);
    this.group.scale.setScalar(0.8);
    camera.add(this.group);
    this.active = false;
    this.group.visible = false;
    this.time = 0;
    this.level = 0;
    this.pouch = 0;
    this.calm = false;
    this.motes = [];
    this.idleMotes = [];
    this.bundles = [];
    this._nozzle = new THREE.Vector3();
    this._build();
  }

  _build() {
    const cream = new THREE.MeshStandardMaterial({ color: 0xfff4dd, roughness: 0.45, metalness: 0.12 });
    const teal = new THREE.MeshStandardMaterial({ color: 0x5fd6c4, roughness: 0.32, metalness: 0.28, emissive: 0x1f7a6c, emissiveIntensity: 0.35 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.28, metalness: 0.4, emissive: 0xffab33, emissiveIntensity: 0.45 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2f4f4a, roughness: 0.7, metalness: 0.1 });

    // A short, chunky canister: cream belly, teal crown, a gold collar and a
    // stubby flared snout, so the whole tool stays in the corner of the screen.
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.13, 6, 12), teal);
    body.rotation.x = Math.PI / 2.4;
    body.position.set(0, 0.01, -0.09);
    body.scale.set(1.06, 1, 1.12);
    this.group.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10), cream);
    belly.scale.set(1.02, 0.85, 1.25);
    belly.position.set(0, -0.07, -0.11);
    this.group.add(belly);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.017, 8, 18), gold);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 0.0, -0.015);
    this.group.add(band);

    // The intake: a flared cone, gold lip, dark throat.
    const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.095, 0.18, 16, 1, true), cream);
    flare.rotation.x = -Math.PI / 2;
    flare.position.set(0, 0.01, -0.25);
    this.group.add(flare);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.014, 8, 24), gold);
    lip.position.set(0, 0.01, -0.335);
    this.group.add(lip);

    const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.09, 0.13, 14, 1, true), dark);
    throat.rotation.x = -Math.PI / 2;
    throat.position.set(0, 0.01, -0.22);
    throat.material.side = THREE.DoubleSide;
    this.group.add(throat);

    // Three fan blades inside the throat, spinning when it is working.
    this.fan = new THREE.Group();
    this.fan.position.set(0, 0.01, -0.235);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xbff6ec, roughness: 0.35, metalness: 0.2, emissive: 0x2f9d8c, emissiveIntensity: 0.5 });
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.13, 0.045), bladeMat);
      blade.position.y = 0.065;
      const holder = new THREE.Group();
      holder.rotation.z = (i / 3) * Math.PI * 2;
      holder.add(blade);
      this.fan.add(holder);
    }
    this.group.add(this.fan);

    // The pouch that fills with what has been gathered.
    this.pouchMesh = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 9), new THREE.MeshStandardMaterial({ color: 0xdfd2a8, roughness: 0.85 }));
    this.pouchMesh.scale.set(0.95, 0.75, 0.95);
    this.pouchMesh.position.set(0, -0.16, -0.1);
    this.group.add(this.pouchMesh);

    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.11, 4, 8), cream);
    grip.position.set(0, -0.16, 0.04);
    grip.rotation.x = -0.5;
    this.group.add(grip);

    // Glow at the mouth + a soft cone of moving air.
    this.nozzleGlow = makeSprite(0xbdf3ff, 0.4, 0.12);
    this.nozzleGlow.position.set(0, 0.01, -0.35);
    this.group.add(this.nozzleGlow);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xbfefff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.2, 20, 1, true), coneMat);
    this.cone.rotation.x = Math.PI / 2;
    this.cone.position.set(0, 0.01, -1.2);
    this.group.add(this.cone);

    this._buildDebris();
  }

  _buildDebris() {
    // A small pool of leaf blades, dust puffs and petals, reused every time.
    this.debrisLeaf = new THREE.Group();
    this.debrisLeaf.visible = false;
    this.scene.add(this.debrisLeaf);
    for (let i = 0; i < 26; i++) {
      const colour = LEAF_COLOURS[i % LEAF_COLOURS.length];
      const mesh = new THREE.Mesh(LEAF_GEO, new THREE.MeshStandardMaterial({
        color: colour,
        roughness: 0.85,
        flatShading: true,
        side: THREE.DoubleSide,
      }));
      mesh.visible = false;
      this.debrisLeaf.add(mesh);
      this.motes.push({ mesh, t: 1, duration: 0.5, spin: 0, from: new THREE.Vector3(), control: new THREE.Vector3(), size: 1 });
    }
    this.dust = new THREE.Group();
    this.dust.visible = false;
    this.scene.add(this.dust);
    this.dustMotes = [];
    for (let i = 0; i < 10; i++) {
      const sprite = makeSprite(0xffe9b8, 0.22, 0.0);
      sprite.visible = false;
      this.dust.add(sprite);
      this.dustMotes.push({ sprite, t: 1, duration: 0.6, from: new THREE.Vector3(), control: new THREE.Vector3() });
    }
  }

  setActive(on) {
    this.active = !!on;
    this.group.visible = this.active;
    if (!this.active) this.setLevel(0);
  }

  setCalm(on) {
    this.calm = !!on;
  }

  /** World position of the mouth, refreshed each call. */
  nozzleWorld(out = this._nozzle) {
    this.group.updateWorldMatrix(true, false);
    return this.nozzleGlow.getWorldPosition(out);
  }

  /** 0..1 how hard it is working; drives glow, cone, fan and the whoosh. */
  setLevel(level) {
    this.level = Math.max(0, Math.min(1, level));
  }

  /** Start a leaf flying from a world point into the mouth. */
  emitLeaf(point, colour = null) {
    const mote = this.motes.find((m) => m.t >= 1);
    if (!mote) return false;
    mote.t = 0;
    mote.duration = 0.78 + Math.random() * 0.3;
    mote.spin = (Math.random() - 0.5) * 9;
    mote.from.copy(point);
    mote.size = 0.75 + Math.random() * 0.4;
    mote.mesh.scale.setScalar(mote.size);
    mote.mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    if (colour !== null) mote.mesh.material.color.setHex(colour);
    mote.mesh.visible = true;
    this.debrisLeaf.visible = true;
    return true;
  }

  emitDust(point) {
    const mote = this.dustMotes.find((m) => m.t >= 1);
    if (!mote) return false;
    mote.t = 0;
    mote.duration = 0.8 + Math.random() * 0.25;
    mote.from.copy(point);
    mote.sprite.visible = true;
    mote.sprite.material.opacity = 0.5;
    this.dust.visible = true;
    return true;
  }

  /** A finished bundle pops at the mouth and drops away. */
  popBundle() {
    const nozzle = this.nozzleWorld(new THREE.Vector3());
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const start = nozzle.clone().addScaledVector(direction, 0.9);
    const home = nozzle.clone().addScaledVector(direction, 2.0);
    home.y -= 0.9;
    const bundle = new THREE.Group();
    const ribbon = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.018, 6, 14),
      new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffab33, emissiveIntensity: 0.4, roughness: 0.4 })
    );
    ribbon.rotation.x = Math.PI / 2;
    bundle.add(ribbon);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(LEAF_GEO, new THREE.MeshStandardMaterial({
        color: LEAF_COLOURS[i % LEAF_COLOURS.length],
        roughness: 0.85,
        flatShading: true,
        side: THREE.DoubleSide,
      }));
      leaf.position.set((Math.random() - 0.5) * 0.12, -0.04 + Math.random() * 0.1, (Math.random() - 0.5) * 0.12);
      leaf.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      bundle.add(leaf);
    }
    bundle.position.copy(start);
    bundle.scale.setScalar(0.45);
    this.scene.add(bundle);
    this.bundles.push({ group: bundle, t: 0, from: start, to: home });
    this.fx?.burst(start, { color: 0xffe9a8, count: 10, speed: 1.4, life: 0.8, size: 0.16, gravity: -1.2 });
    this.pouch = 1;
    return bundle;
  }

  update(dt, time) {
    this.time += dt;
    const level = this.level;
    if (this.active) {
      // A gentle working sway, never a shake; calm motion keeps it still.
      const bob = this.calm ? 0 : Math.sin(this.time * 7) * 0.006 * level;
      this.group.position.y = -0.35 + bob;
      this.group.rotation.z = this.calm ? 0 : Math.sin(this.time * 3.4) * 0.01 * (1 + level);
      this.fan.rotation.z += dt * (2 + level * 34) * (this.calm ? 0.4 : 1);
      this.nozzleGlow.material.opacity = 0.12 + level * 0.42;
      this.nozzleGlow.scale.setScalar(0.55 + level * 0.35);
      this.cone.material.opacity = level * 0.06;
      this.cone.scale.set(0.8 + level * 0.25, 0.8 + level * 0.2, 0.8 + level * 0.25);
      this.pouch = Math.max(0, this.pouch - dt * 0.25);
    }
    this.pouchMesh.scale.set(0.9 + this.pouch * 0.18, 0.7 + this.pouch * 0.2, 0.9 + this.pouch * 0.18);

    // Debris flying to the mouth: a curved path that follows the nozzle as the
    // child looks around, shrinking as it is swallowed.
    this._updateMotes(dt);
    this._updateBundles(dt);
  }

  _updateMotes(dt) {
    const nozzle = this.nozzleWorld(new THREE.Vector3());
    let flying = 0;
    for (const mote of this.motes) {
      if (mote.t >= 1) continue;
      mote.t = Math.min(1, mote.t + dt / mote.duration);
      flying += 1;
      const t = mote.t;
      const ease = t * t;
      const control = this.calm ? mote.from.clone().add(nozzle).multiplyScalar(0.5) : mote.control;
      if (!this.calm) control.copy(mote.from).lerp(nozzle, 0.5).add(new THREE.Vector3(0, 0.35, 0));
      const x = (1 - t) * (1 - t) * mote.from.x + 2 * (1 - t) * t * control.x + ease * nozzle.x;
      const y = (1 - t) * (1 - t) * mote.from.y + 2 * (1 - t) * t * control.y + ease * nozzle.y;
      const z = (1 - t) * (1 - t) * mote.from.z + 2 * (1 - t) * t * control.z + ease * nozzle.z;
      mote.mesh.position.set(x, y, z);
      mote.mesh.rotation.z += dt * mote.spin;
      mote.mesh.rotation.x += dt * mote.spin * 0.6;
      mote.mesh.scale.setScalar(mote.size * (1 - ease * 0.75));
      if (mote.t >= 1) {
        mote.mesh.visible = false;
        mote.mesh.position.copy(nozzle);
      }
    }
    for (const mote of this.dustMotes) {
      if (mote.t >= 1) continue;
      mote.t = Math.min(1, mote.t + dt / mote.duration);
      flying += 0.5;
      const t = mote.t;
      const control = this.calm ? mote.from.clone().add(nozzle).multiplyScalar(0.5) : mote.control;
      if (!this.calm) control.copy(mote.from).lerp(nozzle, 0.5).add(new THREE.Vector3(0.15, 0.4, 0));
      const ease = t * t;
      mote.sprite.position.set(
        (1 - t) * (1 - t) * mote.from.x + 2 * (1 - t) * t * control.x + ease * nozzle.x,
        (1 - t) * (1 - t) * mote.from.y + 2 * (1 - t) * t * control.y + ease * nozzle.y,
        (1 - t) * (1 - t) * mote.from.z + 2 * (1 - t) * t * control.z + ease * nozzle.z
      );
      mote.sprite.material.opacity = 0.5 * (1 - ease);
      if (mote.t >= 1) mote.sprite.visible = false;
    }
    if (flying === 0 && this.active) {
      // Nothing in flight: the intake idles down by itself.
      this.setLevel(Math.max(0, this.level - dt * 2.6));
    }
    this.debrisLeaf.visible = this.motes.some((m) => m.t < 1);
    this.dust.visible = this.dustMotes.some((m) => m.t < 1);
  }

  _updateBundles(dt) {
    for (let i = this.bundles.length - 1; i >= 0; i--) {
      const bundle = this.bundles[i];
      bundle.t += dt / 0.9;
      const t = Math.min(1, bundle.t);
      bundle.group.position.copy(bundle.from).lerp(bundle.to, t);
      bundle.group.position.y += Math.sin(Math.PI * t) * 0.35;
      bundle.group.rotation.y += dt * 3;
      bundle.group.scale.setScalar(0.45 + Math.sin(Math.PI * t) * 0.1);
      if (t >= 1) {
        bundle.group.position.y += 0.05;
        this.scene.remove(bundle.group);
        this.bundles.splice(i, 1);
      }
    }
  }
}
