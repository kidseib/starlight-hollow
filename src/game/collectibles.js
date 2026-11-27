import * as THREE from 'three';
import { makeSprite } from '../world/textures.js';
import { clamp, mulberry32 } from '../engine/utils.js';

/** Golden sparkles: the friendly score currency of the hollow. */
export class SparkleManager {
  constructor(scene, fx, audio) {
    this.scene = scene;
    this.fx = fx;
    this.audio = audio;
    this.items = [];
    this.onCollect = null;
    // Momo's Star Magnet widens and strengthens this pull; the defaults are the
    // gentle radius every child starts with.
    this.magnetRange = 4.6;
    this.magnetPull = 2.5;
    this.geo = new THREE.OctahedronGeometry(0.19, 0);
    this.mat = new THREE.MeshStandardMaterial({
      color: 0xfff4c2,
      emissive: 0xffc94b,
      emissiveIntensity: 1.1,
      roughness: 0.28,
      metalness: 0.25,
      flatShading: true,
    });
  }

  spawn(position, zoneId, opts = {}) {
    const group = new THREE.Group();
    const star = new THREE.Mesh(this.geo, this.mat);
    star.scale.set(1, 1.5, 1);
    group.add(star);
    const glow = makeSprite(0xffe9a8, 1.15, 0.55);
    group.add(glow);
    group.position.copy(position);
    this.scene.add(group);
    this.items.push({
      group,
      star,
      glow,
      home: position.clone(),
      zoneId,
      phase: Math.random() * Math.PI * 2,
      spin: 0.8 + Math.random() * 0.7,
      magnet: 0,
      collected: false,
    });
    return group;
  }

  spawnCluster(center, count, radius, zoneId, groundFn) {
    const rng = mulberry32(Math.floor(center.x * 13 + center.z * 7) + count);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * radius;
      const x = center.x + Math.cos(a) * r;
      const z = center.z + Math.sin(a) * r;
      const y = (groundFn ? groundFn(x, z) : center.y) + 0.85 + rng() * 0.7;
      this.spawn(new THREE.Vector3(x, y, z), zoneId);
    }
  }

  /** A little shower of sparkles that flies out when something is solved. */
  spawnBurst(position, count, zoneId) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const r = 0.4 + Math.random() * 1.3;
      const p = new THREE.Vector3(
        position.x + Math.cos(a) * r,
        position.y + 0.3 + Math.random() * 1.1,
        position.z + Math.sin(a) * r
      );
      this.spawn(p, zoneId, { reward: true });
    }
  }

  update(dt, playerPos, time) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.collected) {
        this.items.splice(i, 1);
        continue;
      }
      it.star.rotation.y += dt * it.spin;
      it.star.rotation.x += dt * 0.3;
      it.group.position.y = it.home.y + Math.sin(time * 1.8 + it.phase) * 0.14;
      it.glow.material.opacity = 0.4 + Math.sin(time * 3 + it.phase) * 0.16;

      const dist = it.group.position.distanceTo(playerPos);
      it.group.visible = dist < 160;
      if (dist < 160 && dist < this.magnetRange) {
        it.magnet = Math.min(1, it.magnet + dt * this.magnetPull);
        const pull = 1 - Math.exp(-7 * dt * it.magnet);
        it.group.position.lerp(playerPos, clamp(pull, 0, 0.5));
        it.home.copy(it.group.position);
      }
      if (dist < 0.95) {
        it.collected = true;
        this.scene.remove(it.group);
        it.glow.material.dispose();
        this.fx?.burst(it.group.position, { color: 0xffe9a8, count: 8, speed: 2.6, life: 0.55, size: 0.42, gravity: -1 });
        this.audio?.collect();
        this.onCollect?.(it);
      }
    }
  }
}

/** The big pink Starberry that appears when a zone is finished. */
export class Starberry {
  constructor(scene, fx, position, zoneId) {
    this.scene = scene;
    this.fx = fx;
    this.zoneId = zoneId;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.targetY = position.y;
    this.state = 'hidden';
    this.group.visible = false;

    const berry = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 18, 14),
      new THREE.MeshStandardMaterial({
        color: 0xff6f91,
        emissive: 0xff3d6e,
        emissiveIntensity: 1.25,
        roughness: 0.3,
        metalness: 0.1,
      })
    );
    berry.scale.set(1, 1.08, 1);
    this.group.add(berry);

    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.4, 5),
      new THREE.MeshStandardMaterial({ color: 0x6ee0a0, roughness: 0.6, flatShading: true, emissive: 0x2e9c68, emissiveIntensity: 0.3 })
    );
    leaf.position.y = 0.52;
    this.group.add(leaf);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.035, 6, 40),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.x = Math.PI / 2.4;
    this.group.add(ring);
    this.ring = ring;

    const glow = makeSprite(0xff9ec4, 3.4, 0.6);
    this.group.add(glow);
    this.glow = glow;

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd6e6,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 2.6, 22, 18, 1, true), beamMat);
    beam.position.y = 11;
    this.group.add(beam);
    this.beam = beam;

    scene.add(this.group);
  }

  appear(fromHeight = 18) {
    this.state = 'descending';
    this.group.visible = true;
    this.group.position.y = this.targetY + fromHeight;
  }

  update(dt, time, playerPos) {
    if (this.state === 'hidden') return false;
    this.ring.rotation.z += dt * 0.9;
    this.glow.material.opacity = 0.45 + Math.sin(time * 2.4) * 0.18;
    this.group.children[0].rotation.y += dt * 0.8;

    if (this.state === 'descending') {
      this.group.position.y = THREE.MathUtils.damp(this.group.position.y, this.targetY, 1.6, dt);
      if (Math.abs(this.group.position.y - this.targetY) < 0.05) {
        this.group.position.y = this.targetY;
        this.state = 'idle';
      }
      return false;
    }

    this.group.position.y = this.targetY + Math.sin(time * 1.4) * 0.16;
    if (playerPos.distanceTo(this.group.position) < 1.5) {
      this.collect();
      return true;
    }
    return false;
  }

  collect() {
    if (this.state === 'collected') return;
    this.state = 'collected';
    this.fx?.fountain(this.group.position, 0xffc0d8, 60);
    this.fx?.burst(this.group.position, { color: 0xfff2b0, count: 30, speed: 7, life: 1.2, size: 0.7, gravity: -3 });
    this.scene.remove(this.group);
  }
}
