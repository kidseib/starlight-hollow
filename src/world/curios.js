import * as THREE from 'three';
import { makeSprite } from './textures.js';

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
  group.userData = { litter, remnant };
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

const BUILDERS = { leaf: buildLeaf, crystal: buildCrystal, stone: buildStone };

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
    out.y += item.type === 'stone' ? 0.95 : 0.45;
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

  /** Zap: scatter the leaves, ring the crystals. Null when there is nothing to do. */
  zap(item) {
    if (!item || item.scatter >= 0.9) return null;
    const first = !item.seen;
    item.seen = true;
    item.scatter = 1;
    item.ready = false;
    item.timer = item.type === 'leaf' ? 22 : 18;
    const point = this.aimPoint(item, new THREE.Vector3());
    this.fx?.burst(point, {
      color: item.type === 'leaf' ? 0xd9862f : 0x7fd9f7,
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
    if (!item || item.type !== 'leaf' || !item.ready) return null;
    item.suck = Math.min(1, (item.suck ?? 0) + 0.03);
    const point = this.aimPoint(item, new THREE.Vector3());
    point.x += (Math.random() - 0.5) * 0.7;
    point.z += (Math.random() - 0.5) * 0.7;
    point.y += (Math.random() - 0.2) * 0.25;
    return point;
  }

  /** The last leaf is in: the drift rests and gathers itself back later. */
  drain(item) {
    if (!item) return;
    const data = item.group.userData;
    item.ready = false;
    item.timer = 22;
    item.scatter = 1;
    item.suck = 1;
    data.litter.visible = false;
    data.remnant.visible = true;
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

      if (item.type === 'leaf') {
        const sip = item.ready ? (item.suck ?? 0) : 0;
        data.litter.visible = item.scatter < 0.98;
        data.litter.scale.setScalar(Math.max(0.12, (1 - item.scatter * 0.82) * (1 - sip * 0.85)));
        data.litter.position.y = item.scatter * 0.05;
        data.litter.rotation.y = Math.sin(time * 0.6 + item.phase) * 0.04;
        data.remnant.visible = item.scatter > 0.3;
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
