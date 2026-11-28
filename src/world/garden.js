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
import {
  ARBOR_MAX,
  GIFT_MAX,
  WISH_MAX,
  arborStage,
  moonPhase,
  phaseLight,
  wishCount,
  sanitizeGifts,
} from '../game/gifts.js';

// The arbor's moon is a sphere lit from a direction that turns with the phase.
// Seen head-on, the lit hemisphere *is* the crescent, half or gibbous shape, so
// the silhouette is carved by the geometry and the terminator stays soft - no
// dark disc in front, which read as an eyeball from the path.
const MOON_VERT = `
  varying vec3 vLitNormal;
  void main() {
    vLitNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const MOON_FRAG = `
  uniform vec3 uLight;
  uniform vec3 uLit;
  uniform vec3 uDark;
  uniform float uGain;
  uniform float uSoft;
  uniform float uRim;
  varying vec3 vLitNormal;
  void main() {
    vec3 n = normalize(vLitNormal);
    float facing = dot(n, normalize(uLight));
    float lit = smoothstep(-uSoft, uSoft, facing);
    // A faint edge light keeps the dark side reading as a moon, not a hole in the sky.
    float rim = pow(1.0 - abs(n.z), 2.2);
    vec3 col = mix(uDark, uLit * uGain, lit) + uLit * uRim * rim;
    gl_FragColor = vec4(col, 1.0);
  }`;

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
  constructor({ island, position, yaw = 0, fx = null, gifts = null, arbor = 0, wishes = 0 }) {
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
    this._buildArbor();

    this.group.traverse((o) => {
      if (o.isMesh) o.castShadow = false;
    });

    this.setGifts(gifts);
    this.setArbor(arbor, wishes);
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


  // ---------------------------------------------------------------- arbor ----

  /**
   * The Moon Arbor behind the bed: bare posts and unlit paper lanterns from the
   * first frame, so a child can see there is more garden to grow into. When all
   * three spots are full, gifts hang its lights; six wake it and a moon moth
   * moves in; after that each gift is a wish that calls another firefly.
   */
  _buildArbor() {
    const wood = mat(0x8a6a4e, { roughness: 0.92 });
    const darkWood = mat(0x6d4f38, { roughness: 0.95 });
    this.arborGroup = new THREE.Group();
    this.arborGroup.position.set(0, 0, -1.95);
    this.group.add(this.arborGroup);

    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.095, 1.75, 6), wood);
      post.position.set(side * 1.55, 0.87, 0);
      this.arborGroup.add(post);
      const foot = new THREE.Mesh(new THREE.DodecahedronGeometry(0.17, 0), mat(0xcbbfa6, { roughness: 0.95 }));
      foot.scale.set(1.1, 0.6, 1.1);
      foot.position.set(side * 1.55, 0.07, 0);
      this.arborGroup.add(foot);

      // Honeysuckle climbing each post: a few leaves, never a bare pole.
      for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 3), mat(0x5f9b4a, { emissive: 0x1f4d16, emissiveIntensity: 0.28 }));
        leaf.position.set(side * 1.55 + (i % 2 ? 0.09 : -0.09), 0.42 + i * 0.34, 0.03);
        leaf.rotation.z = (i % 2 ? -1 : 1) * 0.7;
        this.arborGroup.add(leaf);
      }
    }

    // A gentle arch: a half torus squashed so its rise is about half a metre.
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.062, 6, 22, Math.PI), wood);
    arch.position.set(0, 1.7, 0);
    arch.scale.set(1, 0.3, 1);
    this.arborGroup.add(arch);
    for (const side of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), darkWood);
      cap.position.set(side * 1.55, 1.72, 0);
      this.arborGroup.add(cap);
    }

    // Six paper lanterns hanging along the arch, dark until a gift lights them.
    this.arborLights = [];
    for (let i = 0; i < ARBOR_MAX; i++) {
      const a = Math.PI * ((i + 0.5) / ARBOR_MAX);
      const x = Math.cos(a) * 1.36;
      const y = 1.68 + Math.sin(a) * 0.36 - 0.19;
      const hang = new THREE.Group();
      hang.position.set(x, y, 0);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.16, 3), mat(0x5d4632));
      cord.position.y = 0.13;
      hang.add(cord);
      const cage = new THREE.Mesh(
        new THREE.SphereGeometry(0.115, 8, 6),
        mat(0x9a8f7b, { roughness: 0.45, emissive: 0x000000, emissiveIntensity: 0.02, transparent: true, opacity: 0.8 })
      );
      cage.scale.y = 1.2;
      hang.add(cage);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.035, 6), darkWood);
      cap.position.y = 0.14;
      hang.add(cap);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.013, 4, 10), darkWood);
      ring.rotation.x = Math.PI / 2;
      hang.add(ring);
      const glow = makeSprite(0xffc46b, 0.95, 0);
      hang.add(glow);
      this.arborGroup.add(hang);
      this.arborLights.push({ hang, cage, glow });
    }

    // The moon under the arch: dim while the arbor sleeps, and a carved phase
    // once the wishes start turning it.
    const moonCord = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.22, 3), mat(0x5d4632));
    moonCord.position.set(0, 1.9, 0.16);
    this.arborGroup.add(moonCord);
    this.arborMoon = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 48, 32),
      new THREE.ShaderMaterial({
        uniforms: {
          uLight: { value: new THREE.Vector3(0, 0, 1) },
          uLit: { value: new THREE.Color(0xfff4d6) },
          uDark: { value: new THREE.Color(0x322e5c) },
          uGain: { value: 2.2 },
          uSoft: { value: 0.06 },
          uRim: { value: 0.07 },
        },
        vertexShader: MOON_VERT,
        fragmentShader: MOON_FRAG,
        fog: false,
      })
    );
    this.arborMoon.position.set(0, 1.72, 0.16);
    this.arborGroup.add(this.arborMoon);
    this.arborMoonGlow = makeSprite(0xffe2a0, 2.2, 0.08);
    this.arborMoonGlow.position.set(0, 1.72, 0.14);
    this.arborGroup.add(this.arborMoonGlow);

    // The moon moth that moves in when the arbor wakes: four soft wings, a
    // banded body and feathered feelers, small enough to read as a creature.
    this.moth = new THREE.Group();
    const wingMat = mat(0xb49cf0, { roughness: 0.6, emissive: 0x6a4fbd, emissiveIntensity: 0.4, transparent: true, opacity: 0.95 });
    const makeMothWing = (side, upper) => {
      const pivot = new THREE.Group();
      const wing = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), wingMat);
      wing.scale.set(0.16, 0.02, upper ? 0.2 : 0.12);
      wing.position.x = side * (upper ? 0.15 : 0.11);
      wing.position.z = upper ? -0.02 : 0.05;
      pivot.add(wing);
      pivot.userData.side = side;
      return pivot;
    };
    this.mothWings = [
      makeMothWing(-1, true), makeMothWing(1, true),
      makeMothWing(-1, false), makeMothWing(1, false),
    ];
    this.moth.add(...this.mothWings);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.14, 4, 6), mat(0xf0e6d2, { roughness: 0.6 }));
    body.rotation.x = Math.PI / 2;
    this.moth.add(body);
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.008, 4, 8), mat(0x8a7bb8));
      band.rotation.x = Math.PI / 2;
      band.position.z = -0.04 + i * 0.045;
      this.moth.add(band);
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 6), mat(0xf6eddc, { emissive: 0x9b87d8, emissiveIntensity: 0.3 }));
    head.position.z = 0.1;
    this.moth.add(head);
    for (const side of [-1, 1]) {
      const feeler = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.13, 3), mat(0x8a7bb8));
      feeler.position.set(side * 0.025, 0.05, 0.16);
      feeler.rotation.set(-0.6, 0, side * 0.45);
      this.moth.add(feeler);
    }
    // Two soft eye-spots, so the wings read as wings at a glance.
    for (const side of [-1, 1]) {
      const spot = new THREE.Mesh(new THREE.CircleGeometry(0.045, 8), mat(0x5b4794, { emissive: 0x2c1f52, emissiveIntensity: 0.35 }));
      spot.rotation.x = -Math.PI / 2;
      spot.position.set(side * 0.17, 0.006, -0.02);
      this.moth.add(spot);
    }
    this.moth.scale.setScalar(1.25);
    this.moth.position.set(0, 1.24, 0.7);
    this.moth.visible = false;
    this.mothGlow = makeSprite(0xe6dcff, 1.0, 0);
    this.mothGlow.position.set(0, 1.24, 0.68);
    this.mothGlow.visible = false;
    this.arborGroup.add(this.mothGlow);
    this.arborGroup.add(this.moth);

    // Fireflies called by wishes after the arbor wakes.
    this.fireflies = [];
    for (let i = 0; i < WISH_MAX; i++) {
      const fly = makeSprite(0xffe6a0, 0.11, 0);
      fly.visible = false;
      this.arborGroup.add(fly);
      this.fireflies.push(fly);
    }
  }

  setArbor(rawStage = 0, rawWishes = 0) {
    const stage = arborStage(rawStage);
    const wishes = wishCount(rawWishes);
    const calm = reducedMotion();
    this.arborStage = stage;
    this.wishLights = wishes;
    const phase = moonPhase(wishes);
    this.moonPhaseId = phase.id;
    this.arborLights.forEach((light, i) => {
      const lit = i < stage;
      light.cage.material.color.setHex(lit ? 0xffb347 : 0x9a8f7b);
      light.cage.material.emissive.setHex(lit ? phase.lamp : 0x000000);
      light.cage.material.emissiveIntensity = lit ? 2.6 : 0.02;
      light.cage.material.opacity = lit ? 0.96 : 0.8;
      light.glow.material.color.setHex(phase.lamp);
      light.glow.material.opacity = lit ? (calm ? 0.55 : 0.8) : 0;
    });
    const awake = stage >= ARBOR_MAX;
    const light = phaseLight(phase.angle);
    this._moonHalo = awake ? 0.28 + light.lit * 0.22 : 0.06 + stage * 0.035;
    this.arborMoonGlow.material.opacity = this._moonHalo;
    const moon = this.arborMoon.material.uniforms;
    moon.uLight.value.set(light.x, 0, light.z).normalize();
    moon.uLit.value.setHex(phase.glow);
    moon.uGain.value = awake ? phase.bright : 0.6 + stage * 0.07;
    this.arborMoon.scale.setScalar(phase.scale);
    this.arborMoonGlow.material.color.setHex(phase.glow);
    this.arborMoonGlow.scale.setScalar(1.05 + light.lit * 0.75);
    this.arborMoonGlow.position.x = light.x * 0.05;
    this.moth.visible = awake;
    this.mothGlow.visible = awake;
    this.mothGlow.material.opacity = awake ? 0.35 : 0;
    this.mothWings[0].rotation.z = calm ? 0.35 : 0.6;
    this.mothWings[1].rotation.z = -(calm ? 0.35 : 0.6);
    this.fireflies.forEach((fly, i) => {
      const on = i < Math.min(WISH_MAX, wishes);
      fly.visible = on;
      fly.material.opacity = on ? 0.72 : 0;
      fly.userData.base = i;
    });
    this._calmArbor = calm;
  }

  /** World point for the arbor's own little burst. */
  arborPoint() {
    return this.group.localToWorld(new THREE.Vector3(0, 1.6, -1.9));
  }

  arborFlourish() {
    if (!this.fx) return;
    const calm = reducedMotion();
    this.fx.burst(this.arborPoint(), {
      color: 0xffe2a0,
      count: calm ? 6 : 26,
      speed: calm ? 1.1 : 3.4,
      life: calm ? 0.9 : 1.2,
      size: calm ? 0.4 : 0.6,
      gravity: -1.2,
      up: 1.6,
    });
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
    this.bowlGlow.material.opacity = warm === 0 ? 0 : 0.14 + warm * 0.09;
    this.bowlGlow.scale.setScalar(0.62 + warm * 0.16);
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
    // The arbor: lights breathe, the moth hovers, the fireflies drift.
    const arborLit = (this.arborStage ?? 0) > 0;
    if (arborLit) {
      // The halo breathes around the phase's own brightness; the carve itself
      // never moves, so the moon is the same shape calm or not.
      this.arborMoonGlow.material.opacity = (this._moonHalo ?? 0.3)
        * (calm ? 1 : 0.92 + Math.sin(time * 1.3) * 0.1);
    }
    if (this.moth.visible) {
      const flap = calm ? 0.3 : 0.18 + Math.abs(Math.sin(time * 5.5)) * 0.55;
      this.mothWings.forEach((wing) => {
        wing.rotation.z = wing.userData.side * -flap;
      });
      if (calm) {
        this.moth.position.set(0, 1.24, 0.7);
        this.moth.rotation.set(0, 0, 0);
      } else {
        this.moth.position.set(Math.sin(time * 0.45) * 0.3, 1.24 + Math.sin(time * 1.1) * 0.06, 0.7 + Math.cos(time * 0.4) * 0.08);
        this.moth.rotation.y = Math.sin(time * 0.6) * 0.4;
      }
      if (this.mothGlow) {
        this.mothGlow.position.set(this.moth.position.x, this.moth.position.y, this.moth.position.z - 0.02);
        this.mothGlow.material.opacity = calm ? 0.3 : 0.3 + Math.sin(time * 2.2) * 0.08;
      }
    }
    this.fireflies.forEach((fly, i) => {
      if (!fly.visible) return;
      const a = i * 1.7;
      if (calm) {
        fly.position.set(Math.cos(a) * 1.2, 0.9 + (i % 4) * 0.22, -1.95 + Math.sin(a) * 0.5);
        return;
      }
      const t = time * (0.35 + (i % 3) * 0.08) + a;
      fly.position.set(Math.cos(t) * (1.05 + (i % 3) * 0.16), 0.85 + Math.sin(time * 0.9 + i) * 0.25 + (i % 4) * 0.14, -1.95 + Math.sin(t) * 0.45);
      fly.material.opacity = 0.55 + Math.sin(time * 3 + i * 2) * 0.18;
    });

    // A slow warm pulse on the bowl, and the lanterns breathe with it.
    if (!calm && warm > 0) {
      const pulse = 0.9 + Math.sin(time * 1.5) * 0.12;
      this.bowlGlow.scale.setScalar((0.62 + warm * 0.16) * pulse);
    }
  }
}
