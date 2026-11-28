// The hub grows as keepsakes come home: lanterns light along the path, island
// flags and flower beds fill in, and — once all thirteen are found — a sleeping
// grotto behind the Star Tree opens onto a moonwell and a small chest.

import * as THREE from 'three';
import { makeSprite } from './textures.js';
import { hubBloom, grottoWhisper, GROTTO } from '../game/hubBloom.js';
import { WORLD_IDS } from '../game/secrets.js';

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.86,
    metalness: opts.metalness ?? 0.02,
    flatShading: true,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
  });

const WORLD_COLORS = {
  meadow: 0x9be08a,
  grove: 0xffb4d8,
  falls: 0x8fd6ff,
  peaks: 0xc9a8ff,
  words: 0xffc46b,
  cove: 0x5fe0c0,
};

export class HubGrowth {
  constructor({ island, found = [], taken = false }) {
    this.island = island;
    this.group = new THREE.Group();
    island.group.add(this.group);
    this.lanterns = [];
    this.flags = [];
    this.beds = [];
    this.open = false;
    this.taken = false;
    this._whisperAt = 0;
    this._build();
    this.refresh(found, taken);
  }

  _y(x, z) {
    return this.island.heightAtLocal(x, z);
  }

  _build() {
    this._buildLanterns();
    this._buildFlags();
    this._buildBeds();
    this._buildGrotto();
  }

  /** One lamp for every keepsake, alternating along the path to the market. */
  _buildLanterns() {
    const wood = mat(0x8b6b4a);
    for (let i = 0; i < 13; i++) {
      const x = (i % 2 ? 1 : -1) * 3.3;
      const z = 27 - i * 1.45;
      const post = new THREE.Group();
      post.position.set(x, this._y(x, z), z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.35, 6), wood);
      pole.position.y = 0.67;
      post.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.06), wood);
      arm.position.set(x > 0 ? -0.16 : 0.16, 1.3, 0);
      post.add(arm);
      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.24), mat(0xfff0c0, { roughness: 0.3, emissive: 0xffd166, emissiveIntensity: 0.05, transparent: true, opacity: 0.55 }));
      cage.position.set(x > 0 ? -0.3 : 0.3, 1.14, 0);
      post.add(cage);
      const glow = makeSprite(0xffd166, 1.5, 0.0);
      glow.position.copy(cage.position);
      post.add(glow);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 6), mat(0xffd166, { metalness: 0.35, roughness: 0.4 }));
      roof.position.set(cage.position.x, 1.33, 0);
      post.add(roof);
      this.group.add(post);
      this.lanterns.push({ cage, glow, roof });
    }
  }

  /** Island bunting on the market side: a flag appears the first time you find something there. */
  _buildFlags() {
    const poleMat = mat(0x8b6b4a);
    WORLD_IDS.forEach((zone, i) => {
      const x = 3.4 + i * 0.72;
      const z = 12.6;
      const holder = new THREE.Group();
      holder.position.set(x, this._y(x, z), z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.7, 5), poleMat);
      pole.position.y = 0.85;
      holder.add(pole);
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.02), mat(WORLD_COLORS[zone] ?? 0xffffff, { roughness: 0.7 }));
      cloth.position.set(0.27, 1.45, 0);
      holder.add(cloth);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(0xffd166, { metalness: 0.4 }));
      knob.position.y = 1.72;
      holder.add(knob);
      holder.visible = false;
      this.group.add(holder);
      this.flags.push({ zone, holder });
    });
  }

  /** Six flower beds by the shelf; one blooms when its island is fully collected. */
  _buildBeds() {
    WORLD_IDS.forEach((zone, i) => {
      const x = 2.6 + i * 1.15;
      const z = 18.4;
      const bed = new THREE.Group();
      bed.position.set(x, this._y(x, z), z);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.72), mat(0xc9b894, { flatShading: true }));
      box.position.y = 0.14;
      bed.add(box);
      const soil = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, 0.6), mat(0x7a5a42));
      soil.position.y = 0.29;
      bed.add(soil);
      const plant = new THREE.Group();
      plant.position.y = 0.3;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.4, 5), mat(0x6fbf72));
      stem.position.y = 0.2;
      plant.add(stem);
      for (let p = 0; p < 6; p++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), mat(WORLD_COLORS[zone] ?? 0xffd166, { emissive: WORLD_COLORS[zone] ?? 0xffd166, emissiveIntensity: 0.12, roughness: 0.6 }));
        const a = (p / 6) * Math.PI * 2;
        petal.position.set(Math.cos(a) * 0.16, 0.44, Math.sin(a) * 0.16);
        petal.scale.set(1, 0.6, 1);
        plant.add(petal);
      }
      const centre = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), mat(0xfff2b0, { emissive: 0xffd166, emissiveIntensity: 0.5 }));
      centre.position.y = 0.45;
      plant.add(centre);
      bed.add(plant);
      this.group.add(bed);
      this.beds.push({ zone, plant, centre });
    });
  }

  _buildGrotto() {
    const { x, z } = GROTTO.local;
    const y = this._y(x, z);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    this.grotto = g;

    const stone = mat(0xdccfb4, { flatShading: true });
    const moss = mat(0x86cf7c, { roughness: 0.95 });

    // A little arch facing the meadow path.
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 2.7, 7), stone);
      pillar.position.set(side * 1.55, 1.35, 0);
      g.add(pillar);
      const base = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), moss);
      base.position.set(side * 1.55, 0.12, 0.1);
      base.scale.y = 0.5;
      g.add(base);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.42, 0.62), stone);
    lintel.position.y = 2.72;
    g.add(lintel);
    // A small mossy cap on the lintel, not a roof: the arch should frame the
    // grotto, not sit on top of it.
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 0.22, 7), moss);
    cap.position.y = 3.02;
    g.add(cap);
    for (const side of [-1, 1]) {
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.72), moss);
      brim.position.set(side * 1.55, 2.98, 0);
      g.add(brim);
    }

    // The veil: a shimmering curtain that parts when the grotto wakes.
    this.veil = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9, 2.5),
      mat(0xbfe6ff, { transparent: true, opacity: 0.5, emissive: 0x8fd6ff, emissiveIntensity: 0.5, roughness: 0.2 })
    );
    this.veil.position.set(0, 1.35, 0.06);
    g.add(this.veil);
    this.veilSparkle = makeSprite(0xdfefff, 2.6, 0.22);
    this.veilSparkle.position.set(0, 1.4, 0.1);
    g.add(this.veilSparkle);

    // Stepping stones over the moss, only there once it opens.
    this.stones = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const step = new THREE.Mesh(new THREE.CylinderGeometry(0.42 - t * 0.06, 0.48 - t * 0.06, 0.12, 7), stone);
      step.position.set(2.9 + t * 2.6, 0.06, 1.9 - t * 1.6);
      step.rotation.y = t * 2;
      this.stones.add(step);
    }
    this.stones.visible = false;
    g.add(this.stones);

    // Inside: a moonwell, two crystals, fireflies and the chest.
    const well = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.35, 0.26, 18), stone);
    well.position.set(-1.2, 0.13, -2.6);
    g.add(well);
    this.water = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 20),
      mat(0x9fe4ff, { transparent: true, opacity: 0.85, emissive: 0x8fd6ff, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.3 })
    );
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(-1.2, 0.28, -2.6);
    g.add(this.water);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const rimStone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.17 + (i % 3) * 0.04, 0), i % 2 ? stone : moss);
      rimStone.position.set(-1.2 + Math.cos(a) * 1.55, 0.14, -2.6 + Math.sin(a) * 1.55);
      rimStone.rotation.set(i, i * 2, i * 0.5);
      rimStone.scale.y = 0.7;
      g.add(rimStone);
    }
    for (const [cx, cz, s] of [[-3.2, -3.4, 0.55], [1.1, -3.6, 0.42]]) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), mat(0xc9a8ff, { emissive: 0xc9a8ff, emissiveIntensity: 0.55, roughness: 0.25, transparent: true, opacity: 0.9 }));
      crystal.position.set(cx, s * 0.8, cz);
      crystal.scale.y = 2.1;
      g.add(crystal);
    }
    this.motes = [];
    for (let i = 0; i < 10; i++) {
      const mote = makeSprite(0xfff2b0, 0.32, 0.85);
      const a = (i / 10) * Math.PI * 2;
      const r = 1.2 + (i % 4) * 0.55;
      mote.position.set(-1.2 + Math.cos(a) * r, 0.7 + (i % 3) * 0.45, -2.6 + Math.sin(a) * r);
      mote.userData.base = mote.position.clone();
      mote.userData.phase = i * 0.7;
      g.add(mote);
      this.motes.push(mote);
    }

    // The chest.
    this.chest = new THREE.Group();
    this.chest.position.set(-1.2, 0.3, -0.9);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.52, 0.62), mat(0x9c6b45));
    body.position.y = 0.26;
    this.chest.add(body);
    for (const bx of [-0.28, 0.28]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.56, 0.66), mat(0xffd166, { metalness: 0.5, roughness: 0.32 }));
      band.position.set(bx, 0.26, 0);
      this.chest.add(band);
    }
    this.lid = new THREE.Group();
    this.lid.position.set(0, 0.52, -0.31);
    const lidBox = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.2, 0.66), mat(0xa8754c));
    lidBox.position.set(0, 0.1, 0.31);
    this.lid.add(lidBox);
    const lidBand = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.12), mat(0xffd166, { metalness: 0.5, roughness: 0.32 }));
    lidBand.position.set(0, 0.21, 0.31);
    this.lid.add(lidBand);
    this.chest.add(this.lid);
    this.chestGlow = makeSprite(0xfff2b0, 1.8, 0.0);
    this.chestGlow.position.y = 0.5;
    this.chest.add(this.chestGlow);
    g.add(this.chest);

    this.group.add(g);
    this.grottoCenter = new THREE.Vector3(x, y, z);
    this.chestWorld = new THREE.Vector3(x - 1.2, y + 0.4, z - 0.9);
  }

  /** Apply a found list (already sanitised by the caller) and the chest flag. */
  refresh(found = [], taken = false) {
    const bloom = hubBloom(found);
    this.found = found;
    this.open = bloom.grottoOpen;
    this.taken = !!taken;

    this.lanterns.forEach((lantern, i) => {
      const lit = i < bloom.lanterns;
      lantern.cage.material.emissiveIntensity = lit ? 1.1 : 0.04;
      lantern.cage.material.opacity = lit ? 0.95 : 0.4;
      lantern.roof.material.emissive.set(lit ? 0xffd166 : 0x000000);
      lantern.roof.material.emissiveIntensity = lit ? 0.35 : 0;
      lantern.glow.visible = lit;
      lantern.glow.material.opacity = lit ? 0.5 : 0;
    });
    for (const flag of this.flags) flag.holder.visible = bloom.flags.includes(flag.zone);
    for (const bed of this.beds) {
      const full = bloom.blooms.includes(bed.zone);
      bed.plant.scale.setScalar(full ? 1 : 0.55);
      bed.centre.material.emissiveIntensity = full ? 0.9 : 0.1;
    }

    this.veil.visible = !this.open;
    this.veilSparkle.visible = !this.open;
    this.stones.visible = this.open;
    this.water.material.emissiveIntensity = this.open ? 0.85 : 0.12;
    this.motes.forEach((m) => { m.visible = this.open; });
    this.chest.visible = this.open;
    this.chestGlow.visible = this.open && !this.taken;
    this.lid.rotation.x = this.taken ? -1.9 : 0;
  }

  /** The veil nudges a child back until the grotto wakes; it never traps them. */
  constrain(position, onWhisper = null, time = 0) {
    if (this.open) return false;
    const dx = position.x - this.grottoCenter.x;
    const dz = position.z - this.grottoCenter.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 5.2) return false;
    if (dist < 0.001) {
      position.x += 5.3;
      return true;
    }
    position.x = this.grottoCenter.x + (dx / dist) * 5.3;
    position.z = this.grottoCenter.z + (dz / dist) * 5.3;
    if (onWhisper && time - this._whisperAt > 6) {
      this._whisperAt = time;
      onWhisper(grottoWhisper(this.found));
    }
    return true;
  }

  /** True when the child is standing close enough to the chest to open it. */
  atChest(position) {
    return this.open && !this.taken && this.chestWorld.distanceTo(position) < 2.2;
  }

  takeChest() {
    this.taken = true;
    this.lid.rotation.x = -1.9;
    this.chestGlow.visible = false;
  }

  update(dt, time) {
    for (let i = 0; i < this.lanterns.length; i++) {
      const lantern = this.lanterns[i];
      if (!lantern.glow.visible) continue;
      lantern.glow.material.opacity = 0.42 + Math.sin(time * 2.1 + i) * 0.12;
    }
    if (this.veil.visible) {
      this.veilSparkle.material.opacity = 0.16 + Math.sin(time * 1.6) * 0.07;
      this.veil.material.opacity = 0.42 + Math.sin(time * 1.2) * 0.08;
    }
    if (this.open) {
      this.water.material.emissiveIntensity = 0.7 + Math.sin(time * 1.4) * 0.15;
      for (const mote of this.motes) {
        const base = mote.userData.base;
        mote.position.y = base.y + Math.sin(time * 1.1 + mote.userData.phase) * 0.22;
        mote.material.opacity = 0.4 + Math.sin(time * 1.7 + mote.userData.phase) * 0.25;
      }
      if (!this.taken) this.chestGlow.material.opacity = 0.25 + Math.sin(time * 2.4) * 0.1;
    }
  }
}
