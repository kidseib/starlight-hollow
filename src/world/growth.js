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
    this._buildTreeline();
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
      const glow = makeSprite(0xffd166, 0.95, 0.0);
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
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.72), mat(0xc4a678, { flatShading: true }));
      box.position.y = 0.13;
      bed.add(box);
      // A raised wooden rim, so it reads as a garden bed and not a bowl.
      for (const [rx, rz, rw, rd] of [[0, 0.36, 0.98, 0.09], [0, -0.36, 0.98, 0.09], [0.45, 0, 0.09, 0.72], [-0.45, 0, 0.09, 0.72]]) {
        const rim = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.12, rd), mat(0x9b7a52, { flatShading: true }));
        rim.position.set(rx, 0.32, rz);
        bed.add(rim);
      }
      const soil = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.05, 0.6), mat(0x6b4d38));
      soil.position.y = 0.27;
      bed.add(soil);
      const plant = new THREE.Group();
      plant.position.y = 0.29;
      const bedColor = WORLD_COLORS[zone] ?? 0xffd166;
      // Dainty little flowers: five stems, each with a small four-petal head.
      for (let f = 0; f < 5; f++) {
        const fx = ((f % 3) - 1) * 0.22;
        const fz = (Math.floor(f / 3) - 0.5) * 0.2;
        const h = 0.24 + (f % 2) * 0.09;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, h, 4), mat(0x6fbf72));
        stem.position.set(fx, h / 2, fz);
        stem.rotation.z = (f - 2) * 0.05;
        plant.add(stem);
        for (let p = 0; p < 4; p++) {
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), mat(bedColor, { roughness: 0.55, emissive: bedColor, emissiveIntensity: 0.16 }));
          const a = (p / 4) * Math.PI * 2;
          petal.position.set(fx + Math.cos(a) * 0.055, h, fz + Math.sin(a) * 0.055);
          petal.scale.set(1, 0.55, 1);
          plant.add(petal);
        }
        const pip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 5, 4), mat(0xfff2b0, { emissive: 0xffd166, emissiveIntensity: 0.4 }));
        pip.position.set(fx, h + 0.012, fz);
        plant.add(pip);
      }
      const centre = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(0xfff2b0, { emissive: bedColor, emissiveIntensity: 0.3 }));
      centre.position.set(0, 0.16, 0);
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
    const stoneDark = mat(0xbfae90, { flatShading: true });
    const moss = mat(0x86cf7c, { roughness: 0.95 });
    const gold = mat(0xffd166, { metalness: 0.4, roughness: 0.32 });

    // Two carved columns: plinth, tapered shaft, three carved bands, capital.
    for (const side of [-1, 1]) {
      const px = side * 1.55;
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.26, 0.94), stoneDark);
      plinth.position.set(px, 0.13, 0);
      g.add(plinth);
      const plinthLip = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.08, 1.02), stone);
      plinthLip.position.set(px, 0.29, 0);
      g.add(plinthLip);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.33, 2.3, 8), stone);
      shaft.position.set(px, 1.48, 0);
      g.add(shaft);
      for (const by of [0.62, 1.42, 2.2]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.032, 5, 12), mat(0xd8c8a8, { flatShading: true }));
        band.rotation.x = Math.PI / 2;
        band.position.set(px, by, 0);
        g.add(band);
      }
      const capital = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.2, 0.86), stone);
      capital.position.set(px, 2.73, 0);
      g.add(capital);
      const capitalTrim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 5, 12), gold);
      capitalTrim.rotation.x = Math.PI / 2;
      capitalTrim.position.set(px, 2.86, 0);
      g.add(capitalTrim);

      // A little lantern on each column, so the way in looks kept.
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.07), stoneDark);
      bracket.position.set(px - side * 0.24, 1.86, 0.34);
      g.add(bracket);
      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), mat(0xfff0c0, { emissive: 0xffb84d, emissiveIntensity: 0.9, roughness: 0.35, transparent: true, opacity: 0.92 }));
      cage.position.set(px - side * 0.44, 1.74, 0.34);
      g.add(cage);
      const sconceGlow = makeSprite(0xffd166, 0.55, 0.22);
      sconceGlow.position.copy(cage.position);
      g.add(sconceGlow);
      const sconceRoof = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.13, 6), mat(0x7a6142, { roughness: 0.7 }));
      sconceRoof.position.set(cage.position.x, 1.9, 0.34);
      g.add(sconceRoof);
    }

    // The lintel with a keystone and a star cut into it.
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.44, 0.72), stone);
    lintel.position.y = 3.03;
    g.add(lintel);
    const lintelLip = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.82), stoneDark);
    lintelLip.position.y = 2.78;
    g.add(lintelLip);
    const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.1), stoneDark);
    keystone.rotation.z = Math.PI / 4;
    keystone.position.set(0, 3.03, 0.37);
    g.add(keystone);
    const keystoneLip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.06), stone);
    keystoneLip.rotation.z = Math.PI / 4;
    keystoneLip.position.set(0, 3.03, 0.43);
    g.add(keystoneLip);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), mat(0xfff2b0, { emissive: 0xffd166, emissiveIntensity: 0.85 }));
    star.position.set(0, 3.03, 0.49);
    g.add(star);

    // Ivy tucked around the capitals, rather than strings of beads.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 4), moss);
        const a = i * 1.5 + side;
        leaf.position.set(side * 1.55 + Math.cos(a) * 0.34, 2.62 + (i % 2) * 0.12, Math.sin(a) * 0.3);
        leaf.scale.set(1, 0.5, 0.7);
        leaf.rotation.set(a, a, 0.2);
        g.add(leaf);
      }
    }

    // A mossy threshold so the arch sits on something.
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.14, 0.9), stone);
    threshold.position.set(0, 0.07, 0.72);
    g.add(threshold);
    for (const sx of [-1.05, 0, 1.05]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.92), stoneDark);
      seam.position.set(sx, 0.075, 0.72);
      g.add(seam);
    }
    const thresholdMoss = new THREE.Mesh(new THREE.CircleGeometry(0.26, 8), moss);
    thresholdMoss.rotation.x = -Math.PI / 2;
    thresholdMoss.position.set(-1.2, 0.145, 0.95);
    g.add(thresholdMoss);

    // The veil: a shimmering curtain that parts when the grotto wakes.
    this.veil = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9, 2.6),
      mat(0xbfe6ff, { transparent: true, opacity: 0.58, emissive: 0x8fd6ff, emissiveIntensity: 0.3, roughness: 0.2, side: THREE.DoubleSide })
    );
    this.veil.position.set(0, 1.5, 0.06);
    g.add(this.veil);
    this.veilSparkle = makeSprite(0xdfefff, 2.2, 0.14);
    this.veilSparkle.position.set(0, 1.55, 0.1);
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

    // A rock outcrop closes the back of the grotto, so it is a place rather
    // than an arch standing in an open field.
    const backdrop = [
      [-2.9, -4.6, 1.5, 0], [-1.3, -5.2, 1.9, 1], [0.6, -5.1, 1.7, 2],
      [2.2, -4.6, 1.4, 1], [-4.2, -3.6, 1.1, 0], [3.6, -3.5, 1.0, 2],
    ];
    for (const [bx, bz, size, variant] of backdrop) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), variant === 0 ? stone : stoneDark);
      rock.position.set(bx, size * 0.55, bz);
      rock.rotation.set(bx * 0.3, bz * 0.4, size * 0.2);
      rock.scale.set(1.15, 0.85, 1);
      g.add(rock);
    }

    // Inside: a moonwell, crystals, ferns, mushrooms and the chest.
    const well = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.35, 0.3, 18), stone);
    well.position.set(-1.2, 0.15, -2.6);
    g.add(well);
    const wellRim = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.1, 6, 20), stoneDark);
    wellRim.rotation.x = Math.PI / 2;
    wellRim.position.set(-1.2, 0.31, -2.6);
    g.add(wellRim);
    this.water = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 20),
      mat(0x9fe4ff, { transparent: true, opacity: 0.85, emissive: 0x8fd6ff, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.3 })
    );
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(-1.2, 0.31, -2.6);
    g.add(this.water);
    for (const [lx, lz, lr] of [[-1.7, -2.2, 0.22], [-0.6, -3.1, 0.17], [-2.0, -3.0, 0.14]]) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(lr, 8), mat(0x7fd47a, { roughness: 0.9 }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(lx, 0.325, lz);
      g.add(pad);
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const rimStone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.17 + (i % 3) * 0.04, 0), i % 2 ? stone : moss);
      rimStone.position.set(-1.2 + Math.cos(a) * 1.62, 0.16, -2.6 + Math.sin(a) * 1.62);
      rimStone.rotation.set(i, i * 2, i * 0.5);
      rimStone.scale.y = 0.7;
      g.add(rimStone);
    }
    for (const [cx, cz, cs] of [[-3.2, -3.4, 0.55], [1.1, -3.6, 0.42], [2.3, -2.2, 0.3]]) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(cs, 0), mat(0xc9a8ff, { emissive: 0xc9a8ff, emissiveIntensity: 0.55, roughness: 0.25, transparent: true, opacity: 0.9 }));
      crystal.position.set(cx, cs * 0.8, cz);
      crystal.scale.y = 2.1;
      g.add(crystal);
    }
    // Ferns and mushrooms along the inside walls.
    for (const [fx, fz] of [[-3.6, -1.2], [2.9, -1.4], [-2.8, 0.2]]) {
      const fern = new THREE.Group();
      for (let f = 0; f < 6; f++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.6, 3), mat(0x63c46f, { roughness: 0.95 }));
        const a = (f / 6) * Math.PI * 2;
        frond.position.set(Math.cos(a) * 0.18, 0.3, Math.sin(a) * 0.18);
        frond.rotation.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5 - 0.2);
        fern.add(frond);
      }
      fern.position.set(fx, 0, fz);
      g.add(fern);
    }
    for (const [mx, mz, ms] of [[-2.2, -0.4, 1], [2.0, -0.8, 0.8], [-3.1, -2.0, 0.7]]) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 5), mat(0xfff2dd, { roughness: 0.8 }));
      stem.position.set(mx, 0.15, mz);
      g.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2 * ms, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xff8f7a, { roughness: 0.6, emissive: 0xff6f5a, emissiveIntensity: 0.15 }));
      cap.position.set(mx, 0.3, mz);
      cap.scale.y = 0.7;
      g.add(cap);
    }
    for (const [gx, gz, gr] of [[-1.2, -1.6, 1.1], [1.6, -3.2, 0.8]]) {
      const mossPatch = new THREE.Mesh(new THREE.CircleGeometry(gr, 12), moss);
      mossPatch.rotation.x = -Math.PI / 2;
      mossPatch.position.set(gx, 0.02, gz);
      g.add(mossPatch);
    }
    // A small stone bench to sit and look at the water.
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.36), stone);
    benchSeat.position.set(1.1, 0.44, -1.7);
    g.add(benchSeat);
    for (const lx of [-0.32, 0.32]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.3), stoneDark);
      leg.position.set(1.1 + lx, 0.22, -1.7);
      g.add(leg);
    }

    this.motes = [];
    for (let i = 0; i < 10; i++) {
      const mote = makeSprite(0xfff2b0, 0.3, 0.85);
      const a = (i / 10) * Math.PI * 2;
      const r = 1.2 + (i % 4) * 0.55;
      mote.position.set(-1.2 + Math.cos(a) * r, 0.7 + (i % 3) * 0.45, -2.6 + Math.sin(a) * r);
      mote.userData.base = mote.position.clone();
      mote.userData.phase = i * 0.7;
      g.add(mote);
      this.motes.push(mote);
    }

    // The chest.
    const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.86, 0.16, 9), stoneDark);
    footing.position.set(-1.2, 0.08, -0.9);
    g.add(footing);
    this.chest = new THREE.Group();
    this.chest.position.set(-1.2, 0.16, -0.9);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.52, 0.62), mat(0x9c6b45));
    body.position.y = 0.26;
    this.chest.add(body);
    for (const bx of [-0.28, 0.28]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.56, 0.66), gold);
      band.position.set(bx, 0.26, 0);
      this.chest.add(band);
    }
    this.lid = new THREE.Group();
    this.lid.position.set(0, 0.52, -0.31);
    const lidBox = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.2, 0.66), mat(0xa8754c));
    lidBox.position.set(0, 0.1, 0.31);
    this.lid.add(lidBox);
    const lidBand = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.12), gold);
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

  /** Trees and shrubs ring the grotto so it sits in a clearing, not a lawn. */
  _buildTreeline() {
    const trunkMat = mat(0x8b6b4a);
    const leafA = mat(0x8ed47f, { roughness: 0.95 });
    const leafB = mat(0x6fbf72, { roughness: 0.95 });
    const bushMat = mat(0x7ccf86, { roughness: 0.95 });
    const mossMat = mat(0x86cf7c, { roughness: 0.95 });
    const darkStone = mat(0xbfae90, { flatShading: true });
    const cx = GROTTO.local.x;
    const cz = GROTTO.local.z;
    const spots = [
      [-9.5, -1.5, 3.2], [-8.2, -6.8, 2.6], [-6.4, 4.6, 2.2],
      [7.6, -6.2, 3.0], [9.2, 1.4, 2.4], [4.2, 6.4, 2.0],
      [-2.4, 8.6, 2.8], [0.6, -9.4, 3.4],
    ];
    spots.forEach(([dx, dz, h], i) => {
      const x = cx + dx;
      const z = cz + dz;
      const y = this._y(x, z);
      const tree = new THREE.Group();
      tree.position.set(x, y, z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, h, 6), trunkMat);
      trunk.position.y = h / 2;
      trunk.rotation.z = (i % 3 - 1) * 0.05;
      tree.add(trunk);
      const blobs = 2 + (i % 2);
      for (let b = 0; b < blobs; b++) {
        const r = 0.9 + (i % 4) * 0.16 + b * 0.1;
        const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), b % 2 ? leafA : leafB);
        blob.position.set((b - 0.5) * 0.8, h + 0.2 + b * 0.5, (b % 2 ? 0.4 : -0.3));
        blob.rotation.set(b, i, b * 0.6);
        blob.scale.y = 0.85;
        tree.add(blob);
      }
      this.group.add(tree);
    });
    // A worn approach: scattered stones and tufts between path and arch.
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const ax = cx + 2.6 - t * 3.4 + Math.sin(i * 2.3) * 0.8;
      const az = cz + 8.4 - t * 4.6 + Math.cos(i * 1.7) * 0.6;
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13 + (i % 3) * 0.05, 0), i % 3 === 0 ? mossMat : darkStone);
      pebble.position.set(ax, this._y(ax, az) + 0.06, az);
      pebble.rotation.set(i, i * 1.7, i * 0.6);
      pebble.scale.y = 0.55;
      this.group.add(pebble);
      if (i % 2 === 0) {
        for (let f = 0; f < 3; f++) {
          const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 3), bushMat);
          tuft.position.set(ax + Math.cos(i + f) * 0.3, this._y(ax, az) + 0.15, az + Math.sin(i + f) * 0.3);
          tuft.rotation.z = (f - 1) * 0.3;
          this.group.add(tuft);
        }
      }
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.4;
      const r = 7.4 + (i % 3) * 0.9;
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + (i % 3) * 0.13, 0), bushMat);
      bush.position.set(x, this._y(x, z) + 0.35, z);
      bush.rotation.set(i, i * 2, i * 0.4);
      bush.scale.y = 0.8;
      this.group.add(bush);
    }
  }

  /** Apply a found list (already sanitised by the caller) and the chest flag. */
  refresh(found = [], taken = false) {
    const bloom = hubBloom(found);
    this.found = found;
    this.open = bloom.grottoOpen;
    this.taken = !!taken;

    this.lanterns.forEach((lantern, i) => {
      const lit = i < bloom.lanterns;
      lantern.cage.material.emissiveIntensity = lit ? 0.85 : 0.04;
      lantern.cage.material.opacity = lit ? 0.95 : 0.4;
      lantern.roof.material.emissive.set(lit ? 0xffd166 : 0x000000);
      lantern.roof.material.emissiveIntensity = lit ? 0.35 : 0;
      lantern.glow.visible = lit;
      lantern.glow.material.opacity = lit ? 0.5 : 0;
    });
    for (const flag of this.flags) flag.holder.visible = bloom.flags.includes(flag.zone);
    for (const bed of this.beds) {
      const full = bloom.blooms.includes(bed.zone);
      bed.plant.scale.setScalar(full ? 1.25 : 0.55);
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
      lantern.glow.material.opacity = 0.26 + Math.sin(time * 2.1 + i) * 0.07;
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
