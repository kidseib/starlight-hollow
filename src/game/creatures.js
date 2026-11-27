import * as THREE from 'three';
import { TAU, clamp, damp, mulberry32, shortAngle } from '../engine/utils.js';
import { makeSprite } from '../world/textures.js';

const eyeGeo = new THREE.SphereGeometry(0.17, 12, 10);
const pupilGeo = new THREE.SphereGeometry(0.085, 10, 8);
const cheekGeo = new THREE.SphereGeometry(0.1, 8, 6);
const shadowGeo = new THREE.CircleGeometry(0.52, 20);

function shadowMesh() {
  const mesh = new THREE.Mesh(
    shadowGeo,
    new THREE.MeshBasicMaterial({ color: 0x2c2f52, transparent: true, opacity: 0.2, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  return mesh;
}

/** A round, bouncy, extremely friendly little creature. */
class Puffkin {
  constructor(def, groundFn, fx, audio) {
    this.type = 'puff';
    this.def = def;
    this.name = def.species;
    this.fact = def.fact;
    this.groundFn = groundFn;
    this.fx = fx;
    this.audio = audio;
    this.home = new THREE.Vector3(def.x, 0, def.z);
    this.home.y = groundFn(def.x, def.z);
    this.position = this.home.clone();
    this.target = this.home.clone();
    this.heading = Math.random() * TAU;
    this.befriended = false;
    this.happy = 0;
    this.hopClock = Math.random() * 1.4;
    this.hopLength = 1.5 + Math.random() * 0.6;
    this.blinkTimer = 2 + Math.random() * 3;
    this.blink = 0;
    this.chirpTimer = 6 + Math.random() * 10;
    this.giftTimer = 9;
    this.scanned = false;
    this.group = new THREE.Group();
    this._build();
    this.group.position.copy(this.position);
  }

  _build() {
    const bodyColor = new THREE.Color(this.def.color);
    const accent = new THREE.Color(this.def.accent);

    this.bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.58, metalness: 0.03, flatShading: false });
    this.body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 16), this.bodyMat);
    this.body.scale.set(1, 0.92, 1);
    this.body.position.y = 0.62;
    this.group.add(this.body);

    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 16, 12),
      new THREE.MeshStandardMaterial({ color: accent.clone().lerp(new THREE.Color(0xffffff), 0.55), roughness: 0.7 })
    );
    belly.position.set(0, 0.5, 0.26);
    belly.scale.set(1, 0.85, 0.5);
    this.group.add(belly);

    this.eyes = [];
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }));
      eye.position.set(s * 0.19, 0.78, 0.38);
      const pupil = new THREE.Mesh(pupilGeo, new THREE.MeshStandardMaterial({ color: 0x2a2b45, roughness: 0.25 }));
      pupil.position.set(s * 0.19, 0.78, 0.49);
      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      glint.position.set(s * 0.19 + 0.03, 0.82, 0.54);
      this.group.add(eye, pupil, glint);
      this.eyes.push({ eye, pupil, glint, side: s });

      const cheek = new THREE.Mesh(
        cheekGeo,
        new THREE.MeshStandardMaterial({ color: 0xff9ec4, roughness: 0.8, transparent: true, opacity: 0.75 })
      );
      cheek.position.set(s * 0.32, 0.6, 0.34);
      cheek.scale.set(1, 0.7, 0.4);
      this.group.add(cheek);
    }

    // little antennae with glowing tips
    for (const s of [-1, 1]) {
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.03, 0.34, 5),
        new THREE.MeshStandardMaterial({ color: accent, roughness: 0.7 })
      );
      stalk.position.set(s * 0.18, 1.12, 0);
      stalk.rotation.z = s * 0.35;
      this.group.add(stalk);
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 10, 8),
        new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.1, roughness: 0.3 })
      );
      tip.position.set(s * 0.27, 1.28, 0);
      this.group.add(tip);
      const tipGlow = makeSprite(accent, 0.55, 0.5);
      tipGlow.position.copy(tip.position);
      this.group.add(tipGlow);
      if (s < 0) this.tipGlow = tipGlow;
    }

    this.shadow = shadowMesh();
    this.group.add(this.shadow);
  }

  _pickTarget(playerPos) {
    const distToPlayer = this.position.distanceTo(playerPos);
    if (this.befriended) {
      if (distToPlayer > 3.2) {
        const a = Math.random() * TAU;
        this.target.set(playerPos.x + Math.cos(a) * 1.9, 0, playerPos.z + Math.sin(a) * 1.9);
      } else {
        this.target.copy(this.position);
      }
      return;
    }
    if (distToPlayer < 7 && Math.random() < 0.6) {
      // hop closer out of curiosity, but keep a polite distance
      const dir = playerPos.clone().sub(this.position).normalize();
      this.target.copy(this.position).addScaledVector(dir, 2.2);
      return;
    }
    const a = Math.random() * TAU;
    const r = Math.random() * 3.6;
    this.target.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
  }

  update(dt, time, playerPos) {
    this.hopClock += dt;
    if (this.hopClock > this.hopLength) {
      this.hopClock = 0;
      this.hopLength = 1.2 + Math.random() * 0.9;
      this._pickTarget(playerPos);
    }

    const hopPhase = (this.hopClock / this.hopLength) * Math.PI;
    const hopY = Math.sin(hopPhase) * (this.befriended ? 0.34 : 0.24);

    const toTarget = this.target.clone().sub(this.position);
    toTarget.y = 0;
    const dist = toTarget.length();
    if (dist > 0.35) {
      const speed = this.befriended ? 2.6 : 1.5;
      toTarget.normalize();
      this.position.addScaledVector(toTarget, Math.min(dist, speed * dt));
      this.position.y = this.groundFn(this.position.x, this.position.z);
      const wanted = Math.atan2(toTarget.x, toTarget.z);
      this.heading += shortAngle(this.heading, wanted) * clamp(dt * 6, 0, 1);
    }

    this.group.position.set(this.position.x, this.position.y + hopY, this.position.z);
    this.group.rotation.y = this.heading;

    // squash & stretch gives the hop its bounce
    const stretch = 1 + Math.cos(hopPhase * 2) * 0.07;
    this.body.scale.set(1 / stretch, 0.92 * stretch, 1 / stretch);

    // look at the player when close
    const lookDist = this.position.distanceTo(playerPos);
    const lookStrength = clamp(1 - lookDist / 9, 0, 1);
    if (lookStrength > 0.02) {
      const local = this.group.worldToLocal(playerPos.clone());
      const yaw = Math.atan2(local.x, local.z);
      for (const e of this.eyes) {
        const px = clamp(Math.sin(yaw) * 0.05 * lookStrength, -0.06, 0.06);
        e.pupil.position.x = e.side * 0.19 + px;
        e.glint.position.x = e.side * 0.19 + px + 0.03;
      }
    }

    // blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer < 0) {
      this.blink = 0.14;
      this.blinkTimer = 2.5 + Math.random() * 3.5;
    }
    if (this.blink > 0) {
      this.blink -= dt;
      const s = this.blink > 0 ? 0.12 : 1;
      for (const e of this.eyes) e.eye.scale.y = s;
    } else {
      for (const e of this.eyes) {
        e.eye.scale.y = damp(e.eye.scale.y, 1, 16, dt);
      }
    }

    // happy wiggle after being zapped
    if (this.happy > 0) {
      this.happy = Math.max(0, this.happy - dt);
      this.group.rotation.z = Math.sin(time * 22) * 0.12 * this.happy;
    } else {
      this.group.rotation.z = damp(this.group.rotation.z, 0, 10, dt);
    }

    this.shadow.scale.setScalar(1 - hopY * 0.7);
    this.shadow.material.opacity = 0.22 - hopY * 0.12;

    // occasional happy chirp
    this.chirpTimer -= dt;
    if (this.chirpTimer < 0) {
      this.chirpTimer = 9 + Math.random() * 14;
      if (lookDist < 14) this.audio?.chime(Math.floor(Math.random() * 5));
    }

    if (this.befriended) {
      this.giftTimer -= dt;
      if (this.giftTimer < 0) {
        this.giftTimer = 7 + Math.random() * 6;
        this.fx?.burst(this.group.position.clone().setY(this.group.position.y + 0.9), {
          color: 0xffe9a8,
          count: 10,
          speed: 2.2,
          life: 0.9,
          size: 0.45,
          gravity: -1.4,
          up: 1.2,
        });
        this.audio?.giggle();
        return true; // signals "gifted a sparkle"
      }
    }
    return false;
  }

  acknowledge() {
    this.happy = 1.4;
    this.befriended = true;
    this.blinkTimer = 0.05;
    this.audio?.giggle();
  }
}

/** A grumpy little weed that just wants to be left alone... until you tickle it. */
class Grumbleweed {
  constructor(def, groundFn, fx, audio) {
    this.type = 'grump';
    this.def = def;
    this.groundFn = groundFn;
    this.fx = fx;
    this.audio = audio;
    this.home = new THREE.Vector3(def.x, 0, def.z);
    this.home.y = groundFn(def.x, def.z);
    this.position = this.home.clone();
    this.target = this.home.clone();
    this.heading = Math.random() * TAU;
    this.hopClock = Math.random();
    this.hopLength = 1.8 + Math.random();
    this.hidden = false;
    this.hideTimer = 0;
    this.group = new THREE.Group();
    this._build();
    this.group.position.copy(this.position);
  }

  _build() {
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x6f8a5a, roughness: 0.7, flatShading: true });
    this.body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), this.bodyMat);
    this.body.scale.set(1.05, 0.9, 1);
    this.body.position.y = 0.52;
    this.group.add(this.body);

    this.spikes = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.3, 5),
        new THREE.MeshStandardMaterial({ color: 0x4d6b3e, roughness: 0.8, flatShading: true })
      );
      spike.position.set(Math.cos(a) * 0.42, 0.62 + Math.sin(a * 2) * 0.1, Math.sin(a) * 0.42);
      spike.rotation.z = -Math.cos(a) * 0.7;
      spike.rotation.x = Math.sin(a) * 0.7;
      this.group.add(spike);
      this.spikes.push(spike);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({ color: 0xfff6e0, roughness: 0.4 }));
      eye.position.set(s * 0.17, 0.6, 0.38);
      eye.scale.set(0.9, 0.62, 0.9);
      this.group.add(eye);
      const pupil = new THREE.Mesh(pupilGeo, new THREE.MeshStandardMaterial({ color: 0x2a2b45 }));
      pupil.position.set(s * 0.17, 0.58, 0.46);
      pupil.scale.set(1, 0.65, 1);
      this.group.add(pupil);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.05), new THREE.MeshStandardMaterial({ color: 0x3d5530 }));
      brow.position.set(s * 0.17, 0.74, 0.42);
      brow.rotation.z = s * -0.45;
      this.group.add(brow);
    }

    this.shadow = shadowMesh();
    this.group.add(this.shadow);
  }

  update(dt, time, playerPos) {
    if (this.hidden) {
      this.hideTimer -= dt;
      if (this.hideTimer <= 0) {
        this.hidden = false;
        this.group.visible = true;
        const a = Math.random() * TAU;
        const r = 6 + Math.random() * 14;
        this.position.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
        this.position.y = this.groundFn(this.position.x, this.position.z);
        this.group.position.copy(this.position);
        this.group.scale.setScalar(0.1);
      }
      return false;
    }

    this.group.scale.setScalar(damp(this.group.scale.x, 1, 6, dt));

    this.hopClock += dt;
    if (this.hopClock > this.hopLength) {
      this.hopClock = 0;
      this.hopLength = 1.4 + Math.random();
      const a = Math.random() * TAU;
      const r = 1.5 + Math.random() * 3.5;
      this.target.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
    }

    const hopPhase = (this.hopClock / this.hopLength) * Math.PI;
    const hopY = Math.abs(Math.sin(hopPhase)) * 0.16;

    const toTarget = this.target.clone().sub(this.position);
    toTarget.y = 0;
    if (toTarget.length() > 0.4) {
      toTarget.normalize();
      this.position.addScaledVector(toTarget, 1.1 * dt);
      this.position.y = this.groundFn(this.position.x, this.position.z);
      this.heading += shortAngle(this.heading, Math.atan2(toTarget.x, toTarget.z)) * clamp(dt * 4, 0, 1);
    }

    this.group.position.set(this.position.x, this.position.y + hopY, this.position.z);
    this.group.rotation.y = this.heading;
    this.group.rotation.z = Math.sin(time * 2.2 + this.heading) * 0.04;
    this.shadow.scale.setScalar(1 - hopY);
    return false;
  }

  poke() {
    this.hidden = true;
    this.hideTimer = 16;
    this.group.visible = false;
    this.fx?.burst(this.group.position.clone().setY(this.group.position.y + 0.6), {
      color: 0xbfe8a0,
      count: 18,
      speed: 4,
      life: 0.9,
      size: 0.5,
      gravity: -3,
    });
    this.audio?.giggle();
  }
}

export class CreatureManager {
  constructor(scene, fx, audio) {
    this.scene = scene;
    this.fx = fx;
    this.audio = audio;
    this.creatures = [];
    this.scanTarget = null;
    this.onGift = null;
  }

  buildZone(zone, groundFn) {
    const rng = mulberry32(zone.seed + 17);
    for (const raw of zone.creatures) {
      // Creature data is island-local; shift it into world space.
      const def = { ...raw, x: zone.origin.x + raw.x, z: zone.origin.z + raw.z };
      const c = def.kind === 'grump' ? new Grumbleweed(def, groundFn, this.fx, this.audio) : new Puffkin(def, groundFn, this.fx, this.audio);
      c.zoneId = zone.id;
      // slight random offset so repeat visits feel alive
      c.position.x += (rng() - 0.5) * 0.8;
      c.position.z += (rng() - 0.5) * 0.8;
      c.home.x = c.position.x;
      c.home.z = c.position.z;
      this.creatures.push(c);
      this.scene.add(c.group);
    }
  }

  update(dt, time, playerPos, playerForward, zoneId) {
    this.scanTarget = null;
    let bestDot = 0.62;
    for (const c of this.creatures) {
      if (c.zoneId !== zoneId) continue;
      const gifted = c.update(dt, time, playerPos);
      if (gifted) this.onGift?.(c);
      if (c.type !== 'puff' || c.hidden) continue;
      const dist = c.position.distanceTo(playerPos);
      if (dist > 6.5) continue;
      const dir = c.position.clone().setY(playerPos.y).sub(playerPos).normalize();
      const dot = dir.dot(playerForward);
      if (dot > bestDot) {
        bestDot = dot;
        this.scanTarget = c;
      }
    }
  }

  /** Zap everything within a small sphere; returns the closest creature. */
  zapAt(position, radius = 1.2) {
    let best = null;
    let bestDist = radius;
    for (const c of this.creatures) {
      if (c.hidden) continue;
      const center = c.group.position.clone().setY(c.group.position.y + 0.7);
      const dist = center.distanceTo(position);
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    return best;
  }

  count() {
    return this.creatures.length;
  }

  /** Hide every creature of a far-away island so it costs nothing to render. */
  setZoneVisible(zoneId, visible) {
    for (const c of this.creatures) {
      if (c.zoneId === zoneId) c.group.visible = visible && !(c.type === 'grump' && c.hidden);
    }
  }
}
