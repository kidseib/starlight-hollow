import * as THREE from 'three';
import { makeSprite } from './textures.js';
import { GATHER_TYPES, CURIO_REGROW } from '../game/curios.js';

// Curious things: the scenery on every island that answers when a child zaps it
// or looks at it. Three kinds, all built from shaped, layered forms rather than
// bare primitives:
//
//   leaf    a drift of autumn leaves, twigs and a shy mushroom; a zap scatters it
//   crystal a cluster of faceted sun crystals on a mossy plinth; a zap rings it
//   stone   a carved listening stone with a rune ring; the scanning gaze opens it
//
// Nothing is ever lost: a scattered drift and a rung crystal gather themselves
// again, and a stone can be listened to as often as a child likes. The field owns
// only art and state-as-play; rewards and speech come from the game.

const LEAF_COLOURS = [0xc4642a, 0xd98d34, 0xa94d28, 0xe3ad3f, 0xb9702f];
const STONE_MAT = () => new THREE.MeshStandardMaterial({ color: 0x9d9a8e, roughness: 0.95, flatShading: true });
const MOSS_MAT = () => new THREE.MeshStandardMaterial({ color: 0x5f8f4a, roughness: 1, flatShading: true });

function leafGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0, 0,
    -0.1, 0.03, 0.14,
    0, 0.06, 0.3,
    0.1, 0.03, 0.14,
  ]), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

const LEAF_GEO = leafGeometry();

function leafMaterial(colour) {
  return new THREE.MeshStandardMaterial({
    color: colour,
    roughness: 0.85,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });
}

function pebble(rand, colour = 0x8b887c) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + rand() * 0.08, 0), STONE_MAT());
  rock.material.color.setHex(colour);
  rock.scale.set(1.2, 0.7, 1);
  rock.rotation.set(rand() * 3, rand() * 3, rand() * 3);
  return rock;
}

/** A drift of leaves: faceted clumps, a fan of blades, a twig and a shy mushroom. */
function buildLeaf(rand) {
  const group = new THREE.Group();
  const litter = new THREE.Group();
  const clumpGeo = new THREE.DodecahedronGeometry(1, 0);
  const colours = [...LEAF_COLOURS, 0xe9c46a, 0x9c4a2f];
  for (let i = 0; i < 9; i++) {
    const clump = new THREE.Mesh(clumpGeo, leafMaterial(colours[i % colours.length]));
    const a = rand() * Math.PI * 2;
    const r = rand() * 0.46;
    const size = 0.3 + rand() * 0.18;
    clump.scale.set(size * 1.25, size * 0.52, size);
    clump.position.set(Math.cos(a) * r, 0.13 + rand() * 0.16, Math.sin(a) * r);
    clump.rotation.set(rand() * 0.8, rand() * Math.PI, rand() * 0.6);
    litter.add(clump);
  }
  // Blades lying on the pile, densest at the crown.
  for (let i = 0; i < 28; i++) {
    const leaf = new THREE.Mesh(LEAF_GEO, leafMaterial(colours[i % colours.length]));
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.78;
    const dome = Math.max(0, 0.34 * (1 - (r / 0.82) ** 2));
    leaf.position.set(Math.cos(a) * r, 0.2 + dome * (0.55 + rand() * 0.6), Math.sin(a) * r);
    leaf.rotation.set(-Math.PI / 2 + (rand() - 0.5) * 0.55, rand() * Math.PI * 2, (rand() - 0.5) * 0.5);
    leaf.scale.setScalar(0.65 + rand() * 0.7);
    litter.add(leaf);
  }
  // A few curled leaves flicked up around the rim, so the silhouette is leafy.
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(LEAF_GEO, leafMaterial(colours[(i + 2) % colours.length]));
    const a = (i / 9) * Math.PI * 2 + rand() * 0.4;
    const r = 0.66 + rand() * 0.2;
    leaf.position.set(Math.cos(a) * r, 0.24 + rand() * 0.12, Math.sin(a) * r);
    leaf.rotation.set(-0.9 - rand() * 0.7, a + Math.PI / 2, (rand() - 0.5) * 0.6);
    leaf.scale.setScalar(0.55 + rand() * 0.45);
    litter.add(leaf);
  }
  const twig = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.032, 0.66, 5),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1, flatShading: true })
  );
  twig.position.set(0.08, 0.34, 0.04);
  twig.rotation.set(0.12, 0.5, Math.PI / 2 - 0.22);
  litter.add(twig);

  // A mushroom peeking out of the drift, so the pile looks lived in.
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.044, 0.16, 6), new THREE.MeshStandardMaterial({ color: 0xf3e6c4, roughness: 0.9 }));
  stem.position.set(-0.58, 0.18, 0.34);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.105, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd4644a, roughness: 0.8, flatShading: true }));
  cap.position.set(-0.58, 0.25, 0.34);
  cap.scale.y = 0.78;
  litter.add(stem, cap);

  group.add(litter);
  // A few leaves that stay behind when the drift is scattered.
  const remnant = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(LEAF_GEO, leafMaterial(colours[i % colours.length]));
    leaf.position.set((rand() - 0.5) * 0.8, 0.05, (rand() - 0.5) * 0.8);
    leaf.rotation.set(-Math.PI / 2, rand() * Math.PI, 0);
    leaf.scale.setScalar(0.5);
    remnant.add(leaf);
  }
  group.add(remnant);
  group.userData = { gather: litter, litter, remnant };
  group.name = 'curio:leaf';
  return group;
}

/** Sun crystals on a faceted slate slab, with moss at the foot and gold flecks. */
function buildCrystal(rand) {
  const group = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.DodecahedronGeometry(0.78, 0), STONE_MAT());
  slab.scale.set(1.05, 0.2, 0.92);
  slab.rotation.y = 0.4;
  slab.position.y = 0.11;
  group.add(slab);
  const slate = new THREE.MeshStandardMaterial({ color: 0x7f8296, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 5; i++) {
    const shard = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), slate);
    const a = rand() * Math.PI * 2;
    shard.scale.set(1.5, 0.5, 1.1);
    shard.position.set(Math.cos(a) * (0.62 + rand() * 0.2), 0.08, Math.sin(a) * (0.62 + rand() * 0.2));
    shard.rotation.set(rand(), rand(), rand());
    group.add(shard);
  }
  for (let i = 0; i < 4; i++) {
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.12 + rand() * 0.06, 7, 5), MOSS_MAT());
    const a = 0.5 + (i % 2) * 0.34 + rand() * 0.12;
    const r = 0.5 + (i > 1 ? 0.16 : 0);
    moss.scale.set(1.1, 0.38, 1);
    moss.position.set(Math.cos(a) * r, 0.15, Math.sin(a) * r);
    group.add(moss);
  }

  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x7fd9f7,
    roughness: 0.12,
    metalness: 0.15,
    emissive: 0x2d8fc4,
    emissiveIntensity: 0.55,
    flatShading: true,
    transparent: true,
    opacity: 0.94,
  });
  const cluster = new THREE.Group();
  const specs = [
    [0, 0, 0.92, 0.15],
    [0.24, 0.1, 0.62, 0.11],
    [-0.22, 0.06, 0.5, 0.1],
    [0.06, -0.24, 0.4, 0.075],
  ];
  for (const [x, z, height, radius] of specs) {
    const shard = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius, height, 6, 1), crystalMat);
    body.position.y = height / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.55, radius * 2.1, 6), crystalMat);
    tip.position.y = height + radius * 1.05;
    shard.add(body, tip);
    shard.position.set(x, 0.16, z);
    shard.rotation.set((rand() - 0.5) * 0.28, rand() * Math.PI, (rand() - 0.5) * 0.28);
    cluster.add(shard);
  }
  const gold = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffab33, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const fleck = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), gold);
    const a = rand() * Math.PI * 2;
    fleck.position.set(Math.cos(a) * 0.66, 0.18, Math.sin(a) * 0.66);
    cluster.add(fleck);
  }
  const glow = makeSprite(0xa6ecff, 0.9, 0.12);
  glow.position.y = 0.45;
  cluster.add(glow);
  group.add(cluster);
  group.userData = { cluster, glow, crystalMat };
  group.name = 'curio:crystal';
  return group;
}

/** A listening stone: a low, leaning menhir, moss at its foot, runes on both faces. */
function buildStone(rand) {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.1, 6, 1), STONE_MAT());
  shaft.position.y = 0.6;
  // Leaning a little, sunk a little, with a slanted head.
  const lean = 0.075;
  shaft.rotation.z = lean;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.22, 6, 1), STONE_MAT());
  head.position.set(-Math.sin(lean) * 0.62, 1.2, 0);
  head.rotation.set(0.06, 0.4, lean + 0.16);
  group.add(shaft, head);

  // Weathering: a couple of darker plates and a crack.
  const weather = new THREE.MeshStandardMaterial({ color: 0x7a786f, roughness: 1, flatShading: true });
  for (let i = 0; i < 2; i++) {
    const patch = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), weather);
    const a = 0.6 + i * 2.1;
    patch.scale.set(1.1, 0.75, 0.22);
    patch.position.set(Math.cos(a) * 0.19, 0.46 + i * 0.34, Math.sin(a) * 0.19);
    patch.rotation.y = -a + Math.PI / 2;
    group.add(patch);
  }
  const crack = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.46, 0.02), weather);
  crack.position.set(0.12, 0.8, 0.21);
  crack.rotation.z = 0.22;
  group.add(crack);

  // Moss at the foot, not on top.
  for (let i = 0; i < 4; i++) {
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.16 + rand() * 0.09, 7, 5), MOSS_MAT());
    const a = rand() * Math.PI * 2;
    moss.scale.set(1.2, 0.32, 1);
    moss.position.set(Math.cos(a) * 0.34, 0.07, Math.sin(a) * 0.34);
    group.add(moss);
  }
  for (let i = 0; i < 6; i++) {
    const rock = pebble(rand, 0x8e8b80);
    const a = (i / 6) * Math.PI * 2 + rand() * 0.4;
    rock.position.set(Math.cos(a) * 0.6, 0.05, Math.sin(a) * 0.6);
    rock.scale.setScalar(1.1);
    group.add(rock);
  }

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffe6a8,
    roughness: 0.4,
    emissive: 0xffc14d,
    emissiveIntensity: 0.3,
  });
  const strokeGeo = new THREE.BoxGeometry(0.02, 0.12, 0.02);
  const makeRune = (z) => {
    const rune = new THREE.Group();
    rune.position.set(0, 0.78, z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.019, 6, 22), ringMat);
    const a = new THREE.Mesh(strokeGeo, ringMat);
    a.position.set(0, 0.05, 0);
    const b = new THREE.Mesh(strokeGeo, ringMat);
    b.position.set(-0.045, -0.035, 0);
    b.rotation.z = 0.7;
    const c = new THREE.Mesh(strokeGeo, ringMat);
    c.position.set(0.045, -0.035, 0);
    c.rotation.z = -0.7;
    rune.add(ring, a, b, c);
    return rune;
  };
  // One carved face, turned toward the island's centre; a plain back is honest stone.
  const rune = makeRune(0.215, false);
  group.add(rune);

  const glow = makeSprite(0xffe0a3, 0.7, 0.12);
  glow.position.set(0, 0.78, 0.25);
  group.add(glow);
  group.userData = { rune, glow, ringMat };
  group.name = 'curio:stone';
  return group;
}


// --------------------------------------------------------------- petals ----

const PETAL_COLOURS = [0xff8fbe, 0xffb7d8, 0xf26ba6, 0xffe3f0, 0xffc76a];

function petalGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0, 0,
    -0.09, 0.02, 0.11,
    -0.1, 0.06, 0.22,
    0, 0.08, 0.29,
    0.1, 0.06, 0.22,
    0.09, 0.02, 0.11,
  ]), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]);
  geometry.computeVertexNormals();
  return geometry;
}

const PETAL_GEO = petalGeometry();

function petalMaterial(colour) {
  return new THREE.MeshStandardMaterial({
    color: colour,
    emissive: colour,
    emissiveIntensity: 0.22,
    roughness: 0.72,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });
}

function flowerBloom(rand, size = 1) {
  const bloom = new THREE.Group();
  const colour = PETAL_COLOURS[Math.floor(rand() * PETAL_COLOURS.length)];
  const inner = PETAL_COLOURS[Math.floor(rand() * PETAL_COLOURS.length)];
  for (let layer = 0; layer < 2; layer++) {
    const count = layer === 0 ? 6 : 5;
    const tilt = layer === 0 ? -0.6 : -0.25;
    for (let i = 0; i < count; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = (i / count) * Math.PI * 2 + layer * 0.6;
      const petal = new THREE.Mesh(PETAL_GEO, petalMaterial(layer === 0 ? colour : inner));
      petal.rotation.x = tilt;
      petal.position.set(0, layer * 0.012, 0.045 + layer * 0.02);
      petal.scale.setScalar((layer === 0 ? 0.62 : 0.45) * size);
      holder.add(petal);
      bloom.add(holder);
    }
  }
  const heart = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.035 * size, 0),
    new THREE.MeshStandardMaterial({ color: 0xffcf5c, roughness: 0.5, emissive: 0x8a5a10, emissiveIntensity: 0.5, flatShading: true })
  );
  heart.position.y = 0.035;
  bloom.add(heart);
  return bloom;
}

/** A windflower patch: bent stems, layered blooms, buds, fallen petals, a fern. */
function buildPetal(rand) {
  const group = new THREE.Group();
  const gather = new THREE.Group();
  const base = new THREE.Group();
  const remnant = new THREE.Group();

  const tuffet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), MOSS_MAT());
  tuffet.scale.set(1.2, 0.26, 1.05);
  tuffet.position.y = 0.09;
  tuffet.rotation.y = rand() * 3;
  base.add(tuffet);
  for (let i = 0; i < 4; i++) {
    const rock = pebble(rand, 0x9a9c86);
    const a = rand() * Math.PI * 2;
    rock.position.set(Math.cos(a) * (0.62 + rand() * 0.2), 0.08, Math.sin(a) * (0.62 + rand() * 0.2));
    base.add(rock);
  }

  // Five windflowers, each on a stem that bends toward its own little sun.
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4f8f3f, emissive: 0x1c4413, emissiveIntensity: 0.3, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.4;
    const r = 0.16 + rand() * 0.34;
    const h = 0.56 + rand() * 0.46;
    const plant = new THREE.Group();
    plant.position.set(Math.cos(a) * r, 0.12, Math.sin(a) * r);
    plant.rotation.y = -a;

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, h * 0.62, 5), stemMat);
    lower.position.y = h * 0.31;
    plant.add(lower);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, h * 0.45, 5), stemMat);
    neck.position.set(0.05, h * 0.76, 0);
    neck.rotation.z = 0.55;
    plant.add(neck);

    // The bloom is the loose part: the whisk takes it and the stem stays.
    const bloom = flowerBloom(rand, 1.15 + rand() * 0.25);
    bloom.position.set(Math.cos(a) * r + 0.1, 0.12 + h * 0.95, Math.sin(a) * r - 0.06);
    bloom.rotation.set(-0.14, rand() * 2, 0.08);
    gather.add(bloom);

    // A small leaf on the stem.
    const leaf = new THREE.Mesh(LEAF_GEO, new THREE.MeshStandardMaterial({ color: 0x5da84a, emissive: 0x1f4d16, emissiveIntensity: 0.35, roughness: 0.9, flatShading: true, side: THREE.DoubleSide }));
    leaf.position.set(-0.05, h * 0.33, 0.02);
    leaf.rotation.set(-1.1, 0.4, 0.6);
    leaf.scale.setScalar(0.8);
    plant.add(leaf);
    base.add(plant);
  }

  // Two closed buds, so the patch looks like it is still growing.
  for (let i = 0; i < 2; i++) {
    const a = rand() * Math.PI * 2;
    const h = 0.34 + rand() * 0.2;
    const plant = new THREE.Group();
    plant.position.set(Math.cos(a) * 0.5, 0.12, Math.sin(a) * 0.5);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, h, 5), stemMat);
    stem.position.y = h / 2;
    plant.add(stem);
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 5), petalMaterial(PETAL_COLOURS[i + 1]));
    bud.scale.set(0.62, 1.1, 0.62);
    bud.position.set(Math.cos(a) * 0.5, 0.12 + h + 0.05, Math.sin(a) * 0.5);
    gather.add(bud);
    base.add(plant);
  }

  // Fallen petals and a curled fern, which stay behind.
  for (let i = 0; i < 12; i++) {
    const petal = new THREE.Mesh(PETAL_GEO, petalMaterial(PETAL_COLOURS[i % PETAL_COLOURS.length]));
    const a = rand() * Math.PI * 2;
    const r = 0.35 + rand() * 0.6;
    petal.position.set(Math.cos(a) * r, 0.07 + rand() * 0.03, Math.sin(a) * r);
    petal.rotation.set(-Math.PI / 2 + (rand() - 0.5) * 0.3, rand() * Math.PI * 2, 0);
    petal.scale.setScalar(0.36 + rand() * 0.22);
    remnant.add(petal);
  }
  const fern = new THREE.Group();
  fern.position.set(0.55, 0.1, -0.4);
  const fernStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.5, 4), stemMat);
  fernStem.position.y = 0.25;
  fernStem.rotation.z = -0.35;
  fern.add(fernStem);
  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(LEAF_GEO, new THREE.MeshStandardMaterial({ color: 0x4f8f3f, emissive: 0x1f4d16, emissiveIntensity: 0.35, roughness: 0.9, flatShading: true, side: THREE.DoubleSide }));
    frond.position.set(-0.14 - i * 0.045, 0.16 + i * 0.07, 0);
    frond.rotation.set(-1.2, 0.2, Math.PI / 2 - 0.5);
    frond.scale.setScalar(0.5 - i * 0.03);
    fern.add(frond);
  }
  remnant.add(fern);

  group.add(base, remnant, gather);
  group.scale.setScalar(1.5);
  group.userData = { base, gather, remnant };
  group.name = 'curio:petal';
  return group;
}

// ----------------------------------------------------------------- dust ----

const DUST_COLOURS = [0xe8c07a, 0xd9a95f, 0xf2d79a, 0xc08f4e];

/** A sun-warmed dust vent: a ring of broken stone, a gold mound and rising plumes. */
function buildDust(rand) {
  const group = new THREE.Group();
  const gather = new THREE.Group();
  const base = new THREE.Group();
  const remnant = new THREE.Group();

  // A pale stone ring around a dark bowl, so the gold dust inside always reads.
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x6f6480, roughness: 0.95, flatShading: true });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.2;
    const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + rand() * 0.05, 0), ringMat);
    chunk.scale.set(1.15, 1.25, 1.0);
    chunk.position.set(Math.cos(a) * 0.62, 0.24, Math.sin(a) * 0.62);
    chunk.rotation.set(rand() * 0.5, rand() * 3, rand() * 0.4);
    base.add(chunk);
  }
  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.52, 0.18, 12, 1),
    new THREE.MeshStandardMaterial({ color: 0x5a4a63, roughness: 1, flatShading: true })
  );
  bowl.position.y = 0.18;
  base.add(bowl);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.05, 6, 20),
    new THREE.MeshStandardMaterial({ color: 0xffc766, emissive: 0xffa32c, emissiveIntensity: 0.9, roughness: 0.4, flatShading: true })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3;
  base.add(ring);

  // Amber shards standing at the rim, catching the light.
  for (let i = 0; i < 3; i++) {
    const a = 0.7 + i * 2.1;
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.085 + rand() * 0.025, 0),
      new THREE.MeshStandardMaterial({ color: 0xffc766, roughness: 0.35, emissive: 0xd08a20, emissiveIntensity: 0.6, flatShading: true })
    );
    shard.scale.set(0.9, 2.4, 0.9);
    shard.position.set(Math.cos(a) * 0.56, 0.6, Math.sin(a) * 0.56);
    shard.rotation.set(0.15, rand() * 3, 0.2);
    base.add(shard);
  }

  // The dust itself: a bright mound inside the bowl.
  const dustMat = new THREE.MeshStandardMaterial({ color: 0xf6d79a, roughness: 0.85, flatShading: true });
  const mound = new THREE.Mesh(new THREE.DodecahedronGeometry(0.27, 0), dustMat);
  mound.scale.set(1.15, 0.62, 1.1);
  mound.position.y = 0.26;
  gather.add(mound);
  for (let i = 0; i < 5; i++) {
    const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11 + rand() * 0.06, 0), dustMat.clone());
    cap.material.color.setHex(DUST_COLOURS[i % DUST_COLOURS.length]);
    cap.scale.set(1.35, 0.45, 1.05);
    const a = rand() * Math.PI * 2;
    cap.position.set(Math.cos(a) * 0.13, 0.36 + i * 0.035, Math.sin(a) * 0.13);
    cap.rotation.y = rand() * 3;
    gather.add(cap);
  }

  // Amber chips and two bits of driftwood that stay behind.
  for (let i = 0; i < 6; i++) {
    const chip = new THREE.Mesh(new THREE.TetrahedronGeometry(0.06 + rand() * 0.03, 0), new THREE.MeshStandardMaterial({
      color: 0xffc766, roughness: 0.5, emissive: 0x8a5a10, emissiveIntensity: 0.4, flatShading: true,
    }));
    const a = rand() * Math.PI * 2;
    chip.position.set(Math.cos(a) * (0.35 + rand() * 0.4), 0.08, Math.sin(a) * (0.35 + rand() * 0.4));
    chip.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    remnant.add(chip);
  }
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a563a, roughness: 1, flatShading: true });
  for (let i = 0; i < 2; i++) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.45, 5), woodMat);
    stick.position.set(-0.5 + i * 0.09, 0.1, 0.5 - i * 0.13);
    stick.rotation.set(0.2, 0.5 + i, Math.PI / 2 - 0.15);
    base.add(stick);
  }

  // Three plumes that lift higher when the whisk is working.
  const plumes = [];
  for (let i = 0; i < 3; i++) {
    const plume = makeSprite(0xffe6b0, 0.55, 0.45);
    plume.position.set((rand() - 0.5) * 0.24, 0.7 + i * 0.16, (rand() - 0.5) * 0.24);
    gather.add(plume);
    plumes.push(plume);
  }

  // A warm heart in the mound, so the vent glows from a distance.
  const heart = makeSprite(0xffd08a, 0.6, 0.45);
  heart.position.y = 0.42;
  gather.add(heart);

  // Four dust motes that drift up and are pulled in when the whisk works.
  const flurries = [];
  for (let i = 0; i < 4; i++) {
    const mote = makeSprite(0xfff0c8, 0.14, 0.75);
    mote.position.set((rand() - 0.5) * 0.5, 0.45 + rand() * 0.25, (rand() - 0.5) * 0.5);
    gather.add(mote);
    flurries.push(mote);
  }

  group.add(base, remnant, gather);
  group.scale.setScalar(1.3);
  group.userData = { base, gather, remnant, plumes, flurries };
  group.name = 'curio:dust';
  return group;
}

// ----------------------------------------------------------------- motes ---

/** A driftwood perch with sea glass and a slow ring of glow motes. */
function buildMote(rand) {
  const group = new THREE.Group();
  const gather = new THREE.Group();
  const base = new THREE.Group();
  const remnant = new THREE.Group();

  // Driftwood perch: two crossed posts and a leaning branch.
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c5a41, roughness: 0.95, flatShading: true });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.085, 1.45, 6), woodMat);
  post.position.set(-0.06, 0.72, 0);
  post.rotation.z = 0.12;
  base.add(post);
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.045, 0.62, 6), woodMat);
  cross.position.set(-0.06, 1.26, 0);
  cross.rotation.set(0, 0.2, Math.PI / 2 - 0.25);
  base.add(cross);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.42, 5), woodMat);
  branch.position.set(0.18, 0.2, 0.1);
  branch.rotation.set(0.5, 0.3, 0.9);
  base.add(branch);

  // Pebble ring and a little shell.
  for (let i = 0; i < 7; i++) {
    const rock = pebble(rand, 0xb9b2a0);
    const a = (i / 7) * Math.PI * 2 + rand() * 0.3;
    rock.position.set(Math.cos(a) * (0.5 + rand() * 0.16), 0.06, Math.sin(a) * (0.5 + rand() * 0.16));
    base.add(rock);
  }
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xffe9d2, roughness: 0.6, flatShading: true })
  );
  shell.scale.set(1, 0.55, 1.15);
  shell.position.set(0.4, 0.09, -0.32);
  base.add(shell);

  // Sea glass on the perch: three beads that glow while motes gather.
  const glassMats = [];
  const glassColours = [0x9fe9ff, 0xffc2e0, 0xbfffd8];
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: glassColours[i],
      roughness: 0.18,
      metalness: 0.1,
      transparent: true,
      opacity: 0.78,
      emissive: glassColours[i],
      emissiveIntensity: 1.1,
      flatShading: true,
    });
    glassMats.push(mat);
    const bead = new THREE.Mesh(new THREE.IcosahedronGeometry(0.062 + i * 0.01, 0), mat);
    bead.position.set(-0.24 + i * 0.16, 1.1 - i * 0.045, 0.03 + i * 0.02);
    gather.add(bead);
  }

  // Seven glow motes drifting around the perch.
  const motes = [];
  for (let i = 0; i < 7; i++) {
    const mote = makeSprite(0x9fe9ff, 0.14, 0.55);
    const a = (i / 7) * Math.PI * 2;
    mote.position.set(Math.cos(a) * 0.5, 0.95 + Math.sin(a * 2) * 0.14, Math.sin(a) * 0.5);
    gather.add(mote);
    motes.push(mote);
  }

  group.add(base, remnant, gather);
  group.scale.setScalar(1.35);
  group.userData = { base, gather, remnant, motes, glassMats };
  group.name = 'curio:mote';
  return group;
}

const ZAP_COLOURS = {
  leaf: 0xd9862f, petal: 0xf3a6c2, dust: 0xe8c07a, mote: 0x9fe9ff, crystal: 0x7fd9f7,
};

const BUILDERS = { leaf: buildLeaf, petal: buildPetal, dust: buildDust, mote: buildMote, crystal: buildCrystal, stone: buildStone };
const GATHERABLE = new Set(GATHER_TYPES);

export class CurioField {
  constructor({ island, zone, fx }) {
    this.island = island;
    this.zone = zone;
    this.fx = fx;
    this.items = [];
    let seed = 17;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (const def of zone.curios ?? []) {
      const build = BUILDERS[def.type];
      if (!build) continue;
      const group = build(rand);
      const y = island.heightAtLocal(def.x, def.z);
      group.position.set(def.x, y, def.z);
      group.rotation.y = def.face ?? Math.atan2(-def.x, -def.z);
      island.group.add(group);
      this.items.push({
        id: def.id,
        type: def.type,
        group,
        yaw: group.rotation.y,
        point: new THREE.Vector3(),
        ready: true,
        seen: false,
        phase: rand() * Math.PI * 2,
        scatter: 0,
        timer: 0,
      });
    }
    this._tmp = new THREE.Vector3();
    this._dir = new THREE.Vector3();
  }

  /** World point a bolt should aim at — just above the art, not its base. */
  aimPoint(item, out = this._tmp) {
    item.group.getWorldPosition(out);
    out.y += { stone: 0.95, mote: 1.2, petal: 0.95, dust: 0.6 }[item.type] ?? 0.45;
    return out;
  }

  /** The curio a child is looking at, forgiving as everything else in the game. */
  pick(cameraPosition, direction) {
    let best = null;
    let bestAngle = 0.26;
    for (const item of this.items) {
      const point = this.aimPoint(item, new THREE.Vector3());
      const v = point.clone().sub(cameraPosition);
      const dist = v.length();
      if (dist > 16) continue;
      const angle = v.normalize().angleTo(direction);
      if (angle < bestAngle) {
        bestAngle = angle;
        best = item;
      }
    }
    return best;
  }

  /** Zap: scatter what is loose, ring the crystals. Null when there is nothing to do. */
  zap(item) {
    if (!item || item.scatter >= 0.9) return null;
    const first = !item.seen;
    item.seen = true;
    item.scatter = 1;
    item.ready = false;
    item.timer = CURIO_REGROW[item.type] ?? 20;
    const point = this.aimPoint(item, new THREE.Vector3());
    this.fx?.burst(point, {
      color: ZAP_COLOURS[item.type] ?? 0x7fd9f7,
      count: 14,
      speed: 3.0,
      life: 0.95,
      size: 0.24,
      gravity: -2.2,
    });
    this.fx?.burst(point, { color: 0xfff2b0, count: 6, speed: 1.3, life: 1.3, size: 0.4, gravity: 0.5 });
    return { first, type: item.type, id: item.id, point };
  }

  /**
   * The Leafwhisk takes the drift a little at a time. Returns the world point a
   * leaf should fly from, or null when there is nothing loose to gather.
   */
  siphon(item) {
    if (!item || !GATHERABLE.has(item.type) || !item.ready) return null;
    item.suck = Math.min(1, (item.suck ?? 0) + 0.03);
    const point = this.aimPoint(item, new THREE.Vector3());
    const spread = item.type === 'dust' ? 0.45 : item.type === 'mote' ? 0.55 : 0.7;
    point.x += (Math.random() - 0.5) * spread;
    point.z += (Math.random() - 0.5) * spread;
    point.y += (Math.random() - 0.2) * 0.25;
    return point;
  }

  /** The last of it is in: the patch rests and gathers itself back later. */
  drain(item) {
    if (!item) return;
    const data = item.group.userData;
    item.ready = false;
    item.timer = CURIO_REGROW[item.type] ?? 20;
    item.scatter = 1;
    item.suck = 1;
    if (data.gather) data.gather.visible = false;
    if (data.remnant) data.remnant.visible = true;
  }

  /** The scanning gaze: only a listening stone opens, and only up close. */
  scan(item) {
    if (!item || item.type !== 'stone') return null;
    const first = !item.seen;
    item.seen = true;
    item.lit = true;
    const point = this.aimPoint(item, new THREE.Vector3());
    this.fx?.burst(point, { color: 0xffe6a8, count: 12, speed: 1.2, life: 1.2, size: 0.5, gravity: 0.7 });
    return { first, type: item.type, id: item.id, point };
  }

  update(dt, time) {
    for (const item of this.items) {
      const data = item.group.userData;
      if (!item.ready) {
        item.timer = Math.max(0, item.timer - dt);
        if (item.timer === 0) {
          item.ready = true;
          item.scatter = 0.999;
          item.suck = 0;
        }
      }
      // Scatter eases out, regrow eases back in.
      const target = item.ready ? 0 : 1;
      item.scatter += (target - item.scatter) * Math.min(1, dt * (item.ready ? 1.6 : 6));
      if (Math.abs(target - item.scatter) < 0.01) item.scatter = target;

      if (GATHERABLE.has(item.type)) {
        // Loose scenery: it shrinks as it is scattered or sipped, and whatever
        // is left behind stays on the ground until it grows back.
        const sip = item.ready ? (item.suck ?? 0) : 0;
        const shrink = Math.max(0.12, (1 - item.scatter * 0.84) * (1 - sip * 0.86));
        data.gather.visible = item.scatter < 0.98;
        data.gather.scale.setScalar(shrink);
        data.gather.position.y = item.scatter * 0.05;
        data.gather.rotation.y = Math.sin(time * 0.6 + item.phase) * (item.type === 'petal' ? 0.07 : 0.035);
        data.remnant.visible = item.scatter > 0.3;
        if (item.type === 'dust') {
          for (let i = 0; i < (data.flurries?.length ?? 0); i++) {
            const flurry = data.flurries[i];
            const cycle = (time * (0.18 + sip * 0.5) + i * 0.25) % 1;
            const a = time * (0.5 + sip * 3) + i;
            flurry.position.set(Math.cos(a) * 0.26, 0.4 + cycle * 0.55, Math.sin(a) * 0.26);
            flurry.material.opacity = (0.4 + sip * 0.4) * (1 - cycle * 0.4);
          }
          for (let i = 0; i < data.plumes.length; i++) {
            const plume = data.plumes[i];
            const lift = (time * 0.22 + i * 0.33) % 1;
            plume.position.y = 0.5 + lift * (0.3 + sip * 0.55);
            plume.material.opacity = (0.22 + sip * 0.45) * (1 - lift * 0.45);
          }
        } else if (item.type === 'mote') {
          item.orbit = (item.orbit ?? 0) + dt * (0.55 + sip * 5.5);
          for (let i = 0; i < data.motes.length; i++) {
            const cloud = data.motes[i];
            const a = item.orbit + (i / data.motes.length) * Math.PI * 2;
            const r = 0.5 * (1 - sip * 0.72);
            cloud.position.set(Math.cos(a) * r, 0.95 + Math.sin(a * 2 + i) * 0.14 + sip * 0.25, Math.sin(a) * r);
            cloud.material.opacity = (0.4 + Math.sin(time * 2 + i) * 0.14) * (1 - sip * 0.5);
          }
          for (let i = 0; i < data.glassMats.length; i++) {
            data.glassMats[i].emissiveIntensity = (0.5 + Math.sin(time * 1.6 + i) * 0.16) * (1 - sip * 0.8);
          }
        }
      } else if (item.type === 'crystal') {
        const breathe = 0.55 + Math.sin(time * 1.7 + item.phase) * 0.12;
        data.crystalMat.emissiveIntensity = breathe * (1 - item.scatter * 0.55);
        data.glow.material.opacity = (0.16 + Math.sin(time * 1.7 + item.phase) * 0.05) * (1 - item.scatter * 0.6);
        data.cluster.scale.setScalar(1 - item.scatter * 0.7);
      } else if (item.type === 'stone') {
        const lit = item.lit ? 1 : 0;
        data.ringMat.emissiveIntensity = 0.22 + lit * (0.42 + Math.sin(time * 1.3 + item.phase) * 0.08);
        data.glow.material.opacity = 0.1 + lit * (0.24 + Math.sin(time * 1.3 + item.phase) * 0.06);
        data.rune.rotation.z = item.lit ? Math.sin(time * 0.7 + item.phase) * 0.12 : 0;
      }
    }
  }
}
