// Pip's garden: the place the Leafwhisk's bundles go. One authored bed on the
// meadow path with three readable spots — a posy bed, a sun bowl and a lantern
// post — so a child can see at a glance what each family does.
//
// The stages are stored in the save (see `src/game/gifts.js`), and nothing here
// is ever hidden for long: a spot starts dressed but empty, not bare. Every
// animation softens or stops under `reducedMotion()`.

import * as THREE from 'three';
import { makeSprite } from './textures.js';
import { reducedMotion } from '../engine/motion.js';
import { GIFT_MAX, sanitizeGifts } from '../game/gifts.js';

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.86,
    metalness: opts.metalness ?? 0.02,
    flatShading: opts.flatShading ?? true,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
  });

const PETAL_PINKS = [0xff6fae, 0xff8fc4, 0xe84b8f, 0xffa8cf, 0xffc44f];

export class Garden {
  constructor({ island, position, yaw = 0, fx = null, gifts = null }) {
    this.island = island;
    this.fx = fx;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = yaw;
    this.group.scale.setScalar(1.15);
    island.group.add(this.group);

    this.slots = [];
    this.sparkles = [];
    this._time = 0;

    this._buildBed();
    this._buildPosies();
    this._buildBowl();
    this._buildLanterns();

    this.group.traverse((o) => {
      if (o.isMesh) o.castShadow = false;
    });

    this.setGifts(gifts);
  }

  // ------------------------------------------------------------- scenery ----

  _buildBed() {
    // A soft oval of earth, not a faceted slab: a rounded rim with a lighter
    // worked centre, so the bed reads as tended ground at a glance.
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.58, 0.1, 22), mat(0x6d4b34, { roughness: 0.98 }));
    soil.scale.set(1.04, 1, 0.62);
    soil.position.y = 0.05;
    this.group.add(soil);

    const soilTop = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, 0.03, 20), mat(0x7d573c, { roughness: 1 }));
    soilTop.scale.set(1.04, 1, 0.62);
    soilTop.position.set(0, 0.105, 0);
    this.group.add(soilTop);

    // A ring of pale kerb stones, so the bed reads as kept rather than a mound.
    const kerb = mat(0xd8cbb0, { roughness: 0.92 });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + (i % 3) * 0.015, 0), kerb);
      stone.scale.set(1.25, 0.7, 0.95);
      stone.position.set(Math.cos(a) * 1.62, 0.07, Math.sin(a) * 1.02);
      stone.rotation.y = a * 2.3;
      this.group.add(stone);
    }

    // Picket fence along the back, so the garden has a silhouette from the path.
    const wood = mat(0xe6d3ab, { roughness: 0.9 });
    const darkWood = mat(0xa9835a, { roughness: 0.95 });
    for (let i = 0; i < 7; i++) {
      const x = -1.65 + i * 0.55;
      const picket = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.6, 0.05), wood);
      picket.position.set(x, 0.32, -1.02);
      this.group.add(picket);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.1, 4), wood);
      tip.position.set(x, 0.66, -1.02);
      tip.rotation.y = Math.PI / 4;
      this.group.add(tip);
    }
    for (const y of [0.26, 0.5]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.05, 0.04), darkWood);
      rail.position.set(0, y, -1.0);
      this.group.add(rail);
    }

    // Three flat stepping stones from the path to the bed.
    const stepMat = mat(0xcfc2a8, { roughness: 0.95 });
    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.07, 7), stepMat);
      step.position.set(-0.2 + i * 0.24, 0.04, 1.9 - i * 0.52);
      step.rotation.y = i * 0.6;
      this.group.add(step);
    }

    // Low stone ends, so the bed looks built rather than a heap of soil.
    for (const side of [-1, 1]) {
      const end = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), mat(0xcbbfa6, { roughness: 0.95 }));
      end.scale.set(0.8, 0.9, 0.7);
      end.position.set(side * 1.82, 0.16, -0.05);
      end.rotation.y = side * 0.6;
      this.group.add(end);
    }

    // A teal watering can by the posy bed: a little colour and a clear "garden".
    const can = new THREE.Group();
    can.position.set(-1.78, 0.16, 0.62);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.24, 8), mat(0x6fb7a8, { roughness: 0.5, metalness: 0.15 }));
    body.position.y = 0.12;
    can.add(body);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.26, 5), mat(0x6fb7a8, { roughness: 0.5, metalness: 0.15 }));
    spout.position.set(0.14, 0.18, 0);
    spout.rotation.z = -0.8;
    can.add(spout);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 5, 10, Math.PI), mat(0x5aa295, { roughness: 0.5 }));
    handle.position.set(-0.03, 0.26, 0);
    handle.rotation.y = Math.PI / 2;
    can.add(handle);
    this.group.add(can);

    // Three clay pots stacked by the lantern post.
    const clay = mat(0xc8815a, { roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.13, 8), clay);
      pot.position.set(1.62 - i * 0.03, 0.07 + i * 0.11, 0.22 - i * 0.02);
      pot.rotation.y = i * 0.7;
      this.group.add(pot);
    }

    // A little wooden label post with a flower painted on it.
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.6, 5), darkWood);
    post.position.set(-1.95, 0.3, -0.55);
    this.group.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.04), wood);
    board.position.set(-1.95, 0.66, -0.55);
    board.rotation.y = 0.25;
    this.group.add(board);
    const bloom = new THREE.Mesh(new THREE.CircleGeometry(0.09, 5), mat(0xff8fbe, { emissive: 0xd15c8a, emissiveIntensity: 0.4 }));
    bloom.position.set(-1.943, 0.66, -0.518);
    bloom.rotation.y = 0.25;
    bloom.scale.setScalar(1.2);
    this.group.add(bloom);
  }

  _bloom(rand, scale = 1) {
    const flower = new THREE.Group();
    const colour = PETAL_PINKS[Math.floor(rand() * PETAL_PINKS.length)];
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.016, 0.13, 4), mat(0x4f8f3f, { emissive: 0x1c4413, emissiveIntensity: 0.3 }));
    stem.position.y = 0.065;
    flower.add(stem);
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.05, 3), mat(0x5da84a, { emissive: 0x1f4d16, emissiveIntensity: 0.3 }));
    leaf.position.set(0.028, 0.055, 0);
    leaf.rotation.set(-1.0, 0.4, 0.6);
    flower.add(leaf);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.058, 6, 4), mat(colour, { emissive: colour, emissiveIntensity: 0.3, roughness: 0.7 }));
      petal.scale.set(1, 0.4, 0.62);
      petal.position.set(Math.cos(a) * 0.046, 0.138, Math.sin(a) * 0.046);
      petal.rotation.set(0.5, -a, 0.15);
      flower.add(petal);
    }
    const heart = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04, 0), mat(0xffcf5c, { emissive: 0x8a5a10, emissiveIntensity: 0.5 }));
    heart.position.y = 0.145;
    flower.add(heart);
    flower.scale.setScalar(scale);
    return flower;
  }

  _buildPosies() {
    const rand = (() => {
      let seed = 91;
      return () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
    })();

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.3, 0.5), mat(0xb07c4f, { roughness: 0.9 }));
    box.position.set(-1.02, 0.17, 0.05);
    this.group.add(box);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.58), mat(0xd8b98a, { roughness: 0.85 }));
    rim.position.set(-1.02, 0.31, 0.05);
    this.group.add(rim);
    const soil = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.05, 0.42), mat(0x4e3625, { roughness: 1 }));
    soil.position.set(-1.02, 0.33, 0.05);
    this.group.add(soil);

    // Sprouts are always there, so an empty bed still looks tended.
    const sprout = mat(0x6fc15a, { emissive: 0x1f4d16, emissiveIntensity: 0.25 });
    for (let i = 0; i < 6; i++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 3), sprout);
      blade.position.set(-1.38 + i * 0.15, 0.38, 0.05 + (rand() - 0.5) * 0.16);
      blade.rotation.z = (rand() - 0.5) * 0.4;
      this.group.add(blade);
    }

    this.posyClusters = [];
    for (let c = 0; c < GIFT_MAX; c++) {
      const cluster = new THREE.Group();
      cluster.position.set(-1.32 + c * 0.3, 0.36, 0.05 + (c % 2 ? 0.06 : -0.06));

      // Three waiting shoots, so an unfilled bed still looks planted.
      const shoots = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const shoot = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.11, 3), sprout);
        shoot.position.set((i - 1) * 0.07, 0.055, i % 2 ? 0.035 : -0.035);
        shoot.rotation.z = (i - 1) * 0.25;
        shoots.add(shoot);
      }
      cluster.add(shoots);

      // Three flowers at three heights, with leaf tufts at the base: a bush,
      // not a stick.
      for (let f = 0; f < 3; f++) {
        const bloom = this._bloom(rand, 1.0 + rand() * 0.14);
        bloom.position.set((f - 1) * 0.13 + (rand() - 0.5) * 0.04, 0.02, (f % 2 ? 0.08 : -0.08));
        bloom.rotation.y = rand() * 6;
        bloom.rotation.z = (f - 1) * 0.12;
        cluster.add(bloom);
        if (f > 0) {
          const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.09, 3), mat(0x4f9440, { emissive: 0x1f4d16, emissiveIntensity: 0.3 }));
          tuft.position.set((f - 1) * 0.12, 0.035, f % 2 ? -0.055 : 0.055);
          tuft.rotation.z = (f - 1) * 0.5;
          cluster.add(tuft);
        }
      }
      this.group.add(cluster);
      this.posyClusters.push(cluster);
    }

    // A butterfly that arrives with the first posy.
    const wings = new THREE.Group();
    const wingMat = mat(0xffc2de, { emissive: 0xff6fae, emissiveIntensity: 0.55, roughness: 0.45 });
    const wingGeo = new THREE.CircleGeometry(0.075, 8);
    const makeWing = (side) => {
      const pivot = new THREE.Group();
      pivot.position.x = side * 0.012;
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.rotation.x = -Math.PI / 2;
      wing.position.x = side * 0.062;
      wing.scale.set(side * 0.95, 1.35, 1);
      pivot.add(wing);
      return pivot;
    };
    this.wingsLeft = makeWing(-1);
    this.wingsRight = makeWing(1);
    wings.add(this.wingsLeft, this.wingsRight);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.009, 0.11, 5), mat(0x4a3a2a));
    body.rotation.x = Math.PI / 2;
    wings.add(body);
    for (const side of [-1, 1]) {
      const feeler = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 3), mat(0x4a3a2a));
      feeler.position.set(side * 0.012, 0.012, 0.075);
      feeler.rotation.set(-0.9, 0, side * 0.35);
      wings.add(feeler);
    }
    wings.position.set(-0.9, 0.85, 0.15);
    wings.scale.setScalar(1.3);
    this.group.add(wings);
    this.butterfly = wings;
  }

  _buildBowl() {
    const stone = mat(0xa79a8a, { roughness: 0.95 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.24, 10), stone);
    bowl.position.set(0.02, 0.16, 0.02);
    this.group.add(bowl);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 6, 12), mat(0xbfb2a0, { roughness: 0.9 }));
    lip.rotation.x = Math.PI / 2;
    lip.position.set(0.02, 0.28, 0.02);
    this.group.add(lip);

    this.coals = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const coal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075 + (i % 2) * 0.02, 0), mat(0x6b5a4a, { roughness: 0.9 }));
      coal.position.set(0.02 + Math.cos(a) * 0.14, 0.3, 0.02 + Math.sin(a) * 0.14);
      this.group.add(coal);
      this.coals.push(coal);
    }

    this.bowlGlow = makeSprite(0xffc46b, 0.9, 0);
    this.bowlGlow.position.set(0.02, 0.45, 0.02);
    this.group.add(this.bowlGlow);

    this.flames = [];
    for (let i = 0; i < 3; i++) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 5), mat(0xffab52, { emissive: 0xff6a10, emissiveIntensity: 0.9, roughness: 0.4 }));
      flame.position.set(0.02 + (i - 1) * 0.1, 0.4, 0.02 + (i - 1) * 0.045);
      this.group.add(flame);
      this.flames.push(flame);
    }

    this.embers = [];
    for (let i = 0; i < 6; i++) {
      const ember = makeSprite(0xffc46b, 0.12, 0);
      ember.position.set(0.02 + (i % 3 - 1) * 0.12, 0.5, 0.02 + (i > 2 ? 0.07 : -0.07));
      this.group.add(ember);
      this.embers.push(ember);
    }
  }

  _buildLanterns() {
    const wood = mat(0x7c5a41, { roughness: 0.95 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.095, 1.55, 6), wood);
    post.position.set(1.14, 0.77, -0.06);
    this.group.add(post);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.14, 6), wood);
    cap.position.set(1.14, 1.6, -0.06);
    this.group.add(cap);

    this.lanterns = [];
    const heights = [1.4, 1.14, 0.88];
    heights.forEach((h, i) => {
      const side = i % 2 ? -1 : 1;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.045), wood);
      arm.position.set(1.14 + side * 0.14, h + 0.1, -0.06);
      this.group.add(arm);

      const hang = new THREE.Group();
      hang.position.set(1.14 + side * 0.26, h, -0.06);
      const cage = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.2, 0.15),
        mat(0xffe0a0, { roughness: 0.25, emissive: 0xffb02e, emissiveIntensity: 1.2, transparent: true, opacity: 0.82 })
      );
      hang.add(cage);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.1, 5), mat(0x8a6a48, { emissive: 0xffb85a, emissiveIntensity: 0.25 }));
      roof.position.y = 0.15;
      hang.add(roof);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 3), mat(0x5d4632));
      cord.position.y = 0.235;
      hang.add(cord);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.16), mat(0x8a6a48));
      base.position.y = -0.11;
      hang.add(base);
      const glow = makeSprite(0xffc46b, 0.7, 0.5);
      hang.add(glow);
      this.group.add(hang);
      this.lanterns.push({ hang, cage, roof, glow });
    });

    // Motes that gather above the post once every lantern is hung.
    this.motes = [];
    for (let i = 0; i < 4; i++) {
      const mote = makeSprite(0x9fe9ff, 0.13, 0);
      mote.position.set(1.14, 1.75, -0.06);
      this.group.add(mote);
      this.motes.push(mote);
    }

    this.gardenMotes = [];
    for (let i = 0; i < 5; i++) {
      const spark = makeSprite(0xfff2b0, 0.1, 0);
      spark.position.set(-1.0 + i * 0.5, 0.6, 0.1);
      this.group.add(spark);
      this.gardenMotes.push(spark);
    }
  }

  // --------------------------------------------------------------- stages ---

  setGifts(raw) {
    const gifts = sanitizeGifts(raw);
    const calm = reducedMotion();

    this.posyClusters.forEach((cluster, i) => {
      cluster.visible = i < gifts.petal;
    });
    this.butterfly.visible = gifts.petal > 0;
    this.butterfly.userData.visible = gifts.petal > 0;

    const warm = gifts.dust;
    this.bowlGlow.material.opacity = warm === 0 ? 0 : 0.22 + warm * 0.16;
    this.bowlGlow.scale.setScalar(0.8 + warm * 0.28);
    for (const coal of this.coals) {
      coal.material.color.setHex(warm > 0 ? 0xd97f36 : 0x6b5a4a);
      coal.material.emissive.setHex(warm > 0 ? 0xff5a10 : 0x000000);
      coal.material.emissiveIntensity = warm > 0 ? 0.32 + warm * 0.14 : 0;
    }
    for (const flame of this.flames) {
      flame.visible = (warm >= 2) && !calm;
      flame.scale.y = 0.7 + warm * 0.15;
    }
    this.embers.forEach((ember, i) => {
      const on = i < warm * 2;
      ember.visible = on;
      ember.material.opacity = on ? (calm ? 0.5 : 0.85) : 0;
    });

    this.lanterns.forEach((lantern, i) => {
      // Every hook carries a lantern from the start; a gift lights one.
      const lit = i < gifts.mote;
      lantern.hang.visible = true;
      lantern.cage.material.color.setHex(lit ? 0xffe0a0 : 0x9d9280);
      lantern.cage.material.emissive.setHex(lit ? 0xffb02e : 0x000000);
      lantern.cage.material.emissiveIntensity = lit ? 1.4 : 0.04;
      lantern.cage.material.opacity = lit ? 0.86 : 0.55;
      lantern.roof.material.emissiveIntensity = lit ? 0.3 : 0;
      lantern.glow.material.opacity = lit ? 0.55 : 0;
    });
    this.motes.forEach((mote, i) => {
      const on = gifts.mote >= GIFT_MAX;
      mote.visible = on;
      mote.material.opacity = on ? 0.6 : 0;
      mote.userData.base = i;
    });
    this.gardenMotes.forEach((mote, i) => {
      const on = gifts.petal + gifts.dust + gifts.mote >= GIFT_MAX * 2;
      mote.visible = on;
      mote.material.opacity = on ? 0.45 : 0;
      mote.userData.base = i;
    });

    this.gifts = gifts;
    this._calm = calm;
  }

  /** The warm little burst that says "that landed somewhere". */
  flourish(kind) {
    if (!this.fx) return;
    const point = this.slotPoint(kind);
    const calm = reducedMotion();
    const colours = { petal: 0xff9ec4, dust: 0xffc46b, mote: 0x9fe9ff };
    this.fx.burst(point, {
      color: colours[kind] ?? 0xfff2b0,
      count: calm ? 6 : 22,
      speed: calm ? 1.2 : 3.6,
      life: calm ? 0.9 : 1.1,
      size: calm ? 0.4 : 0.55,
      gravity: kind === 'dust' ? 1.2 : -1.4,
      up: kind === 'dust' ? 2.4 : 1.4,
    });
  }

  slotPoint(kind) {
    const local = {
      petal: new THREE.Vector3(-1.02, 0.62, 0.05),
      dust: new THREE.Vector3(0.02, 0.5, 0.02),
      mote: new THREE.Vector3(1.4, 1.0, -0.06),
    }[kind] ?? new THREE.Vector3(0, 0.6, 0);
    return this.group.localToWorld(local.clone());
  }

  /** Where a child aims at each spot; the game picks the nearest to the reticle. */
  aimPoints() {
    return [
      { kind: 'petal', point: this.slotPoint('petal') },
      { kind: 'dust', point: this.slotPoint('dust') },
      { kind: 'mote', point: this.slotPoint('mote') },
    ];
  }

  update(dt, time) {
    this._time = time;
    const calm = reducedMotion();
    if (!calm && this.butterfly.userData.visible) {
      this.butterfly.position.y = 0.8 + Math.sin(time * 1.6) * 0.06;
      this.butterfly.position.x = -0.9 + Math.sin(time * 0.7) * 0.22;
      this.butterfly.rotation.y = Math.sin(time * 1.1) * 0.5;
      const flap = 0.35 + Math.abs(Math.sin(time * 8)) * 0.9;
      this.wingsLeft.rotation.z = flap;
      this.wingsRight.rotation.z = -flap;
    }
    if (calm) {
      this.butterfly.position.set(-0.9, 0.82, 0.1);
      this.butterfly.rotation.y = 0;
      this.wingsLeft.rotation.z = 0.6;
      this.wingsRight.rotation.z = -0.6;
    }

    const warm = this.gifts?.dust ?? 0;
    // Calm motion keeps the light but drops the flicker, even if the setting is
    // changed while the garden is already warm.
    this.flames.forEach((flame, i) => {
      flame.visible = warm >= 2 && !calm;
      if (calm) return;
      flame.scale.y = (0.7 + warm * 0.15) * (0.85 + Math.sin(time * 7 + i * 1.7) * 0.18);
    });
    this.embers.forEach((ember) => {
      if (calm) ember.material.opacity = ember.visible ? 0.5 : 0;
    });
    this.embers.forEach((ember, i) => {
      if (!ember.visible || calm) return;
      const cycle = (time * 0.28 + i * 0.17) % 1;
      ember.position.y = 0.44 + cycle * 0.7;
      ember.position.x = 0.02 + Math.sin(time * 1.3 + i) * 0.12;
      ember.material.opacity = 0.85 * (1 - cycle);
    });
    this.motes.forEach((mote, i) => {
      if (!mote.visible) return;
      if (calm) {
        mote.position.set(1.14 + (i - 1.5) * 0.2, 1.8, -0.06);
        return;
      }
      const a = time * 0.9 + i * 1.6;
      mote.position.set(1.14 + Math.cos(a) * 0.28, 1.78 + Math.sin(time * 1.4 + i) * 0.1, -0.06 + Math.sin(a) * 0.28);
    });
    this.gardenMotes.forEach((mote, i) => {
      if (!mote.visible) return;
      if (calm) {
        mote.position.set(-1.0 + i * 0.5, 0.62, 0.1);
        return;
      }
      const a = time * 0.5 + i * 1.3;
      mote.position.set(-1.0 + i * 0.5 + Math.cos(a) * 0.18, 0.6 + Math.sin(time * 0.9 + i) * 0.14, 0.1 + Math.sin(a) * 0.16);
    });
    // A slow warm pulse on the bowl, and the lanterns breathe with it.
    if (!calm && warm > 0) {
      const pulse = 0.9 + Math.sin(time * 1.5) * 0.12;
      this.bowlGlow.scale.setScalar((0.8 + warm * 0.28) * pulse);
    }
  }
}
