import * as THREE from 'three';
import { mergeStatic } from './staticMerge.js';
import { makeSprite } from './textures.js';
import { reducedMotion } from '../engine/motion.js';

/**
 * The little door in front of a hidden hollow.
 *
 * Two of the thirteen keepsakes are not a walk-in any more. One sleeps behind a
 * curtain of drifting leaves that the Leafwhisk can sip away; the other behind a
 * frost veil held by a hanging bell that a bolt can ring. Both are made of the
 * same warm shapes as the rest of the world — bent boughs, flat-shaded leaves,
 * weathered stones — so the gate reads as scenery with a secret behind it
 * rather than a lock on a door.
 *
 * The child can always undo nothing here: the gate only ever opens, the hollow
 * behind it stays open in the save, and walking away mid-sip simply leaves the
 * curtain a little thinner for next time.
 */

const hash = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
};

const rand = (seed) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

const solid = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.62,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    flatShading: opts.flatShading ?? false,
  });

const LEAF_COLOURS = [0x6fbf6a, 0x8fd97a, 0x54a45a, 0xa7e39b, 0x74c46d];
// A few leaves have already turned, so the curtain is green with warm sparks in
// it instead of one flat slab of the same green.
const DRIFT_ACCENTS = [0xe0c069, 0xcfd06c, 0xb7c95e];

export class SecretGate {
  constructor({ scene, position, gate, open = false, yaw = 0 }) {
    this.scene = scene;
    this.gate = gate;
    this.isOpen = false;
    this.settle = 0;
    this.progress = 0;
    this.told = false;
    this.time = 0;
    this.zoneId = gate.zone ?? null;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = yaw;
    scene.add(this.group);

    this.leaves = [];
    this.veil = [];
    this._build();
    // Boughs, arch stones and posts are a fixed stage; the curtain, its leaves
    // and the frost bell stay live for their own animation.
    mergeStatic(this.group, {
      keep: [this.curtain, this.bell].filter(Boolean),
      tag: 'secret-gate-static',
    });
    if (open) this.setOpen(true, { animate: false });
  }

  _build() {
    const seed = Math.floor(hash(this.gate.id) * 100000) + 7;
    const random = rand(seed);
    if (this.gate.kind === 'drift') this._buildDrift(random);
    else this._buildRing(random);
  }

  /** A curtain of leaves strung between two bent boughs. */
  _buildDrift(random) {
    this.curtain = new THREE.Group();
    this.group.add(this.curtain);
    const wood = solid(0x9b7a52, { roughness: 0.8 });
    for (const side of [-1, 1]) {
      const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, 2.3, 6), wood);
      bough.position.set(side * 1.45, 1.12, 0);
      bough.rotation.z = side * -0.12;
      bough.rotation.x = side * 0.04;
      this.group.add(bough);
      // A little crown of leaves where each bough bends over, so the posts read
      // as living wood rather than two sticks.
      for (let i = 0; i < 3; i++) {
        const tuft = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.17 + random() * 0.05, 0),
          solid(LEAF_COLOURS[(i + 1) % LEAF_COLOURS.length], { roughness: 0.9, flatShading: true })
        );
        tuft.position.set(side * (1.38 + (random() - 0.5) * 0.16), 2.12 + i * 0.12, (random() - 0.5) * 0.2);
        tuft.rotation.set(random() * 3, random() * 3, random() * 3);
        tuft.scale.set(1.2, 0.5, 0.9);
        this.group.add(tuft);
      }
      const curl = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 5, 10, Math.PI * 0.9), wood);
      curl.position.set(side * 1.34, 2.24, 0.04);
      curl.rotation.set(Math.PI / 2, 0, side * 0.6);
      this.group.add(curl);
    }

    // A woven bough arcs over the two posts, so the curtain has a doorway shape
    // a child can read at a glance: this is a way in, and it is shut.
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.075, 6, 18, Math.PI), wood);
    arch.position.set(0, 1.06, 0);
    this.group.add(arch);
    for (let i = 0; i < 5; i++) {
      const bead = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.12, 0),
        solid(LEAF_COLOURS[i % LEAF_COLOURS.length], { roughness: 0.9, flatShading: true })
      );
      const a = Math.PI * (0.18 + i * 0.16);
      bead.position.set(Math.cos(a) * 1.3, 1.06 + Math.sin(a) * 1.3, 0.03);
      bead.scale.set(1.1, 0.45, 0.8);
      bead.rotation.set(0.6 * i, 1.3 * i, 0.4 * i);
      this.group.add(bead);
    }

    // Vines hang from the arch into the curtain, so the leaves are strung on
    // something and the doorway keeps a vertical rhythm.
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      const x = (t * 2 - 1) * 1.12;
      const top = 1.06 + Math.sqrt(Math.max(0, 1.3 * 1.3 - x * x));
      const height = 0.8 + random() * 0.5;
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, height, 4), solid(0x7fae6a, { roughness: 0.9 }));
      vine.position.set(x, top - height / 2, 0.02);
      vine.rotation.z = (random() - 0.5) * 0.12;
      // The vines belong to the curtain: when the leaves are sipped away, the
      // doorway is left truly empty instead of a row of bare sticks.
      this.curtain.add(vine);
      const tip = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.11, 0),
        solid(LEAF_COLOURS[i % LEAF_COLOURS.length], { roughness: 0.9, flatShading: true })
      );
      tip.position.set(x, top - height, 0.03);
      tip.scale.set(1.1, 0.5, 0.8);
      this.curtain.add(tip);
    }

    // A mossy mound at the foot, so the curtain grows out of the ground.
    const mound = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.25, 1),
      solid(0x4e9a55, { roughness: 0.95, flatShading: true })
    );
    mound.position.set(0, -0.36, 0);
    mound.scale.set(1.15, 0.42, 0.55);
    this.group.add(mound);
    for (let i = 0; i < 5; i++) {
      const clump = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.24 + random() * 0.1, 0),
        solid(LEAF_COLOURS[(i + 2) % LEAF_COLOURS.length], { roughness: 0.95, flatShading: true })
      );
      clump.position.set((random() - 0.5) * 2.4, 0.06 + random() * 0.08, (random() - 0.5) * 0.5);
      clump.scale.set(1.2, 0.5, 0.9);
      clump.rotation.set(random() * 2, random() * 3, random() * 2);
      this.group.add(clump);
    }

    // Three rows of clustered leaves, wider at the bottom so the curtain domes.
    const rows = [
      { y: 0.16, count: 9, spread: 1.3 },
      { y: 0.72, count: 9, spread: 1.34 },
      { y: 1.28, count: 8, spread: 1.24 },
      { y: 1.84, count: 6, spread: 1.0 },
    ];
    let index = 0;
    for (const row of rows) {
      for (let i = 0; i < row.count; i++) {
        const t = row.count === 1 ? 0.5 : i / (row.count - 1);
        const x = (t * 2 - 1) * row.spread + (random() - 0.5) * 0.16;
        const y = row.y + (random() - 0.5) * 0.2;
        const z = (random() - 0.5) * 0.24;
        for (let k = 0; k < 2; k++) {
          const warm = random() < 0.12;
          const palette = warm ? DRIFT_ACCENTS : LEAF_COLOURS;
          const leaf = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.17 + random() * 0.16, 0),
            solid(palette[(index + k) % palette.length], { roughness: 0.9, flatShading: true })
          );
          leaf.position.set(x + (random() - 0.5) * 0.28, y + (random() - 0.5) * 0.24, z + k * 0.1);
          leaf.rotation.set(random() * 3, random() * 3, random() * 3);
          leaf.scale.set(1.15, 0.32 + random() * 0.1, 0.8);
          this.curtain.add(leaf);
          this.leaves.push({
            mesh: leaf,
            base: leaf.position.clone(),
            dir: new THREE.Vector3(leaf.position.x, 0.55, leaf.position.z * 1.6).normalize(),
            spin: (random() - 0.5) * 5,
            phase: random() * Math.PI * 2,
          });
        }
        index++;
      }
    }

    // A few leaves already loose on the breeze, so the curtain looks alive.
    for (let i = 0; i < 9; i++) {
      const loose = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.09, 0),
        solid(LEAF_COLOURS[i % LEAF_COLOURS.length], { roughness: 0.9, flatShading: true })
      );
      loose.position.set((random() - 0.5) * 2.6, 0.4 + random() * 1.9, (random() - 0.5) * 0.6);
      loose.scale.set(1.2, 0.35, 0.8);
      this.curtain.add(loose);
      this.leaves.push({
        mesh: loose,
        base: loose.position.clone(),
        dir: new THREE.Vector3(loose.position.x, 0.4, loose.position.z).normalize(),
        spin: (random() - 0.5) * 6,
        phase: random() * Math.PI * 2,
        loose: true,
      });
    }

    this.glow = makeSprite(0xbfe48a, 2.8, 0.1);
    this.glow.position.set(0, 1.1, -0.1);
    this.group.add(this.glow);
  }

  /** Two standing stones holding a frost bell over a soft veil. */
  _buildRing(random) {
    const stone = solid(0x727b9c, { roughness: 0.82, flatShading: true });
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), stone);
      post.position.set(side * 1.26, 0.95, 0);
      post.scale.set(1.0, 1.95, 1.0);
      post.rotation.set(random() * 0.2, random() * 2, side * 0.05);
      this.group.add(post);
      // A cap of frost sits on each stone, with two little spikes, so the gate
      // reads as something the cold grew rather than two plain pillars.
      const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), solid(0xe6f1ff, { roughness: 0.6, flatShading: true }));
      cap.position.set(side * 1.26, 1.82, 0.02);
      cap.scale.set(1, 0.5, 1);
      this.group.add(cap);
      for (let k = 0; k < 2; k++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.055, 0.22 + random() * 0.1, 5),
          solid(0xdbeeff, { roughness: 0.5, flatShading: true, emissive: 0x8fd0ff, emissiveIntensity: 0.25 })
        );
        spike.position.set(side * 1.26 + (k ? 0.1 : -0.09), 1.94 + k * 0.03, (random() - 0.5) * 0.12);
        spike.rotation.z = (k ? -1 : 1) * 0.24;
        this.group.add(spike);
      }
    }

    // A frost-covered lintel joins the two stones, so the gate reads as a
    // doorway with a door in it rather than two shards standing near each other.
    const lintel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.6, 6), stone);
    lintel.rotation.z = Math.PI / 2;
    lintel.position.set(0, 1.86, 0);
    this.group.add(lintel);
    const snow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.0, 1),
      solid(0xe9f2ff, { roughness: 0.55, flatShading: true })
    );
    snow.position.set(0, 1.95, 0);
    snow.scale.set(1.28, 0.13, 0.2);
    this.group.add(snow);

    // The bell: a crystal on a vine, hung from the lintel.
    this.bell = new THREE.Group();
    this.bell.position.set(0, 1.66, 0);
    this.group.add(this.bell);
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.21, 0),
      new THREE.MeshStandardMaterial({
        color: 0xbfe7ff,
        emissive: 0x6fc9ff,
        emissiveIntensity: 0.55,
        roughness: 0.25,
        metalness: 0.15,
        flatShading: true,
      })
    );
    crystal.scale.set(0.85, 1.25, 0.85);
    this.bell.add(crystal);
    this.bellCrystal = crystal;
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), solid(0x7fae6a, { roughness: 0.9 }));
    vine.position.y = 0.36;
    this.bell.add(vine);
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.022, 5, 12),
      solid(0xffd166, { metalness: 0.4, roughness: 0.35, emissive: 0xffb52e, emissiveIntensity: 0.2 })
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.16;
    this.bell.add(band);
    this.bellGlow = makeSprite(0xa9e4ff, 0.9, 0.16);
    this.bellGlow.position.y = -0.02;
    this.bell.add(this.bellGlow);

    this.curtain = new THREE.Group();
    this.group.add(this.curtain);
    // A veil of three soft sheets: mist, not glass, so it never reads as a pane.
    for (let i = 0; i < 5; i++) {
      // Narrow sheets at different heights rather than one wide one: the veil
      // keeps a ragged, fabric edge instead of turning into a bright ball.
      const veil = makeSprite(0xc6e2ff, 1.0, 0.22);
      veil.position.set((i - 2) * 0.42, 0.55 + (i % 2) * 0.55, (i % 2) * 0.07);
      veil.scale.set(1.15, 1.7 + (i % 3) * 0.12, 1);
      this.curtain.add(veil);
      this.veil.push({ sprite: veil, baseY: veil.position.y, phase: i * 1.7, drift: 0.04 + i * 0.012 });
    }
    for (let i = 0; i < 4; i++) {
      const shard = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.4 + random() * 0.3, 5),
        solid(0xcfe8ff, { roughness: 0.45, flatShading: true, emissive: 0x8fd0ff, emissiveIntensity: 0.2 })
      );
      shard.position.set((i < 2 ? -1 : 1) * (1.0 + random() * 0.5), 0.2, 0.28 + random() * 0.2);
      shard.rotation.z = (i % 2 ? 1 : -1) * (0.1 + random() * 0.2);
      this.group.add(shard);
    }
    for (let i = 0; i < 7; i++) {
      const frost = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.07, 0),
        new THREE.MeshStandardMaterial({
          color: 0xe8f6ff,
          emissive: 0x9ad8ff,
          emissiveIntensity: 0.5,
          roughness: 0.4,
          flatShading: true,
        })
      );
      frost.position.set((random() - 0.5) * 2.0, 0.35 + random() * 1.7, (random() - 0.5) * 0.3);
      this.curtain.add(frost);
      this.leaves.push({
        mesh: frost,
        base: frost.position.clone(),
        dir: new THREE.Vector3(frost.position.x, 0.5, 0).normalize(),
        spin: (random() - 0.5) * 4,
        phase: random() * Math.PI * 2,
        loose: true,
      });
    }
  }

  /** Where the bolt should aim: the bell, or the middle of the curtain. */
  bellWorld() {
    const point = new THREE.Vector3(0, this.gate.kind === 'ring' ? 1.86 : 1.1, 0);
    return this.group.localToWorld(point);
  }

  centerWorld() {
    return this.group.localToWorld(new THREE.Vector3(0, 1.0, 0));
  }

  distanceTo(pos) {
    return Math.hypot(pos.x - this.group.position.x, pos.z - this.group.position.z);
  }

  /** One frame of the Leafwhisk at the curtain. Returns true when it is gone. */
  sip(dt) {
    if (this.isOpen) return false;
    this.progress = Math.min(1, this.progress + dt * 0.62);
    return this.progress >= 1;
  }

  /** A leaf the suction can pull into the whisk, in world space. */
  sampleLeaf() {
    if (!this.leaves.length) return null;
    this._sipIndex = ((this._sipIndex ?? 0) + 1) % this.leaves.length;
    return this.leaves[this._sipIndex].mesh.getWorldPosition(new THREE.Vector3());
  }

  setOpen(open, { animate = true } = {}) {
    this.isOpen = !!open;
    this._animate = !!animate && !reducedMotion();
    this.settle = this.isOpen ? (this._animate ? 0.001 : 1) : 0;
    if (!this._animate) this._finishOpen();
    if (!this.isOpen) {
      this.curtain.visible = true;
      for (const leaf of this.leaves) leaf.mesh.visible = true;
    }
  }

  _finishOpen() {
    this.curtain.visible = false;
    if (this.glow) this.glow.material.opacity = 0.05;
    if (this.bellGlow) this.bellGlow.material.opacity = 0.12;
    if (this.bellCrystal) this.bellCrystal.material.emissiveIntensity = 0.25;
  }

  update(dt, time, cameraPos) {
    this.time += dt;
    const calm = reducedMotion();
    const near = cameraPos ? this.distanceTo(cameraPos) : 8;
    const awake = near < 10 ? 1 : 0.45;

    if (this.isOpen) {
      if (this.settle < 1 && this._animate) {
        this.settle = Math.min(1, this.settle + dt / 1.25);
        this._puff(this.settle);
        if (this.settle >= 1) this._finishOpen();
      }
      if (this.bell) {
        // The bell keeps a slow, soft swing once it has been rung.
        const swing = calm ? 0.03 : 0.03 + Math.sin(this.time * 1.1) * 0.06;
        this.bell.rotation.z = swing;
      }
      return;
    }

    if (this.glow) {
      const pulse = calm ? 0 : Math.sin(this.time * 1.4 + 0.6) * 0.04;
      this.glow.material.opacity = (0.16 + this.progress * 0.1) * awake + pulse;
    }
    if (this.bellGlow) {
      const pulse = calm ? 0 : Math.sin(this.time * 2.2) * 0.07;
      this.bellGlow.material.opacity = 0.3 * awake + pulse;
    }

    // Leaves breathe and drift; the sip thins the curtain from the middle out.
    for (const leaf of this.leaves) {
      const sway = calm ? 0 : Math.sin(this.time * 1.3 + leaf.phase) * 0.035;
      const pull = this.progress * (leaf.loose ? 0.35 : 0.6);
      const dir = leaf.dir;
      leaf.mesh.position.set(
        leaf.base.x - dir.x * pull + sway,
        leaf.base.y + (calm ? 0 : Math.sin(this.time * 1.8 + leaf.phase) * 0.05) - pull * 0.25,
        leaf.base.z - dir.z * pull
      );
      leaf.mesh.rotation.z += calm ? 0 : dt * 0.25 * leaf.spin * 0.1;
      const left = 1 - pull * 0.8;
      leaf.mesh.scale.setScalar(Math.max(0.15, left));
    }
    for (const sheet of this.veil) {
      sheet.sprite.position.y = sheet.baseY + (calm ? 0 : Math.sin(this.time * 1.1 + sheet.phase) * sheet.drift);
      sheet.sprite.material.opacity = 0.22 - this.progress * 0.16;
    }
  }

  /** Scatter outward as the gate opens. */
  _puff(settle) {
    for (const leaf of this.leaves) {
      const dir = leaf.dir;
      const push = settle * (leaf.loose ? 2.4 : 1.6);
      leaf.mesh.position.set(
        leaf.base.x + dir.x * push,
        leaf.base.y + settle * (leaf.loose ? 1.8 : 1.1) + Math.sin(settle * Math.PI) * 0.3,
        leaf.base.z + dir.z * push
      );
      leaf.mesh.rotation.y += 0.2;
      const shrink = Math.max(0, 1 - settle);
      leaf.mesh.scale.setScalar(shrink * (leaf.loose ? 1 : 1.1));
    }
    for (const sheet of this.veil) {
      sheet.sprite.material.opacity = 0.22 * Math.max(0, 1 - settle * 1.4);
      sheet.sprite.scale.setScalar(1 + settle * 0.4);
    }
    if (this.glow) this.glow.material.opacity = 0.16 * Math.max(0, 1 - settle);
    if (this.bellGlow) this.bellGlow.material.opacity = 0.3 * (1 - settle) + 0.12 * settle;
    if (this.bellCrystal) this.bellCrystal.material.emissiveIntensity = 0.55 + settle * 1.6;
  }
}
