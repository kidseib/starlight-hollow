import * as THREE from 'three';
import { makeSprite } from './textures.js';
import { trophyMesh } from './discoveries.js';

/**
 * Lantern Hollow — the meadow's sleeping arch opens onto a dusk garden.
 *
 * Nothing here asks a question. It is a place to be in: a moonpetal pond with
 * lily lights, a walk of paper lanterns from the landing to the water, reeds and
 * moths, a stream that slips away under stepping stones, and one quiet corner
 * far from the lanterns where a keepsake sits in a ring of old stones.
 *
 * Everything is authored from the same shapes as the rest of the Hollow — flat
 * shaded blobs, carved posts, weathered stone — but in the hollow's own dusk
 * palette, so it never reads as the meadow with the lights turned down.
 */

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    flatShading: opts.flatShading ?? false,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });

const POND = { x: 0, z: -4, r: 7.4 };

function buildLanternPost(island, x, z, side, index, life) {
  const group = new THREE.Group();
  const y = island.heightAtLocal(x, z);
  group.position.set(x, y, z);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 2.5, 7), mat(0x6a4f6e, { roughness: 0.85 }));
  post.position.y = 1.25;
  group.add(post);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 5, 10), mat(0xc98a3a, { metalness: 0.4, roughness: 0.4 }));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.9;
  group.add(collar);
  // A short arm and a curling hook, so the lantern hangs over the path.
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.62, 6), mat(0x6a4f6e, { roughness: 0.85 }));
  arm.rotation.z = Math.PI / 2;
  arm.position.set(side * 0.3, 2.44, 0);
  group.add(arm);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 5, 10, Math.PI * 1.2), mat(0xc98a3a, { metalness: 0.4, roughness: 0.4 }));
  hook.rotation.set(0, Math.PI / 2, 0);
  hook.position.set(side * 0.62, 2.34, 0);
  group.add(hook);

  // The paper lantern itself: a warm ribbed body with a soft halo.
  const lantern = new THREE.Group();
  lantern.position.set(side * 0.62, 2.06, 0);
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 14, 12),
    mat(index % 2 ? 0xffe6b8 : 0xffd9a0, {
      roughness: 0.4,
      emissive: 0xffb86b,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.95,
    })
  );
  body.scale.set(1, 1.15, 1);
  lantern.add(body);
  for (let i = 0; i < 4; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.272, 0.012, 4, 14), mat(0xc98a3a, { metalness: 0.35, roughness: 0.4 }));
    rib.rotation.y = (i / 4) * Math.PI;
    rib.scale.set(1, 1.12, 1);
    lantern.add(rib);
  }
  const glow = makeSprite(0xffc07a, 2.6, 0.3);
  lantern.add(glow);
  group.add(lantern);

  life.swayers.push({ object: lantern, base: lantern.rotation.x, phase: index * 1.3, amount: 0.035 });
  life.glows.push({ sprite: glow, base: 0.3, phase: index * 0.9 });
  return group;
}

function buildMoonpetalPond(island, life) {
  const group = new THREE.Group();
  const y = island.heightAtLocal(POND.x, POND.z);
  group.position.set(POND.x, y, POND.z);

  // The water: one soft disc with a lighter inner ring, so it reads as a still
  // pool rather than a flat blue circle.
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(POND.r, 42),
    mat(0x2f6a86, { roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.9 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.05;
  group.add(water);
  const sheen = makeSprite(0x9fe8ff, POND.r * 2.2, 0.16);
  sheen.position.y = 0.12;
  group.add(sheen);
  life.glows.push({ sprite: sheen, base: 0.16, phase: 2.2, slow: true });

  // A rim of wet stones, uneven on purpose.
  const stones = 22;
  for (let i = 0; i < stones; i++) {
    const a = (i / stones) * Math.PI * 2;
    const r = POND.r + 0.15 + Math.sin(i * 2.7) * 0.16;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.3 + ((i * 7) % 5) * 0.05, 0),
      mat(i % 3 ? 0x8c8bb0 : 0x76779c, { roughness: 0.9, flatShading: true })
    );
    stone.position.set(Math.cos(a) * r, 0.1 + ((i * 3) % 3) * 0.04, Math.sin(a) * r);
    stone.rotation.set(i * 0.7, i * 1.9, i * 0.4);
    stone.scale.set(1, 0.62, 1);
    group.add(stone);
  }

  // Lily pads with moonpetal flowers: the hollow's own flower, warm on cool.
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.6;
    const r = 1.6 + ((i * 5) % 4) * 1.1;
    const pad = new THREE.Group();
    pad.position.set(Math.cos(a) * r, 0.07, Math.sin(a) * r);
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), mat(0x4f9c8a, { roughness: 0.8, flatShading: true }));
    leaf.rotation.x = -Math.PI / 2;
    leaf.scale.set(1, 0.82, 1);
    pad.add(leaf);
    const notch = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), mat(0x3d7f74, { roughness: 0.8 }));
    notch.rotation.x = -Math.PI / 2;
    notch.position.set(0.42, 0.005, 0);
    pad.add(notch);
    if (i % 2 === 0) {
      const petals = new THREE.Group();
      petals.position.y = 0.06;
      for (let k = 0; k < 5; k++) {
        const petal = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 8, 6),
          mat(0xffe6b8, { roughness: 0.4, emissive: 0xffb86b, emissiveIntensity: 0.55 })
        );
        const pa = (k / 5) * Math.PI * 2;
        petal.position.set(Math.cos(pa) * 0.16, 0.04, Math.sin(pa) * 0.16);
        petal.scale.set(1, 0.5, 0.8);
        petals.add(petal);
      }
      const heart = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0xfff2b0, { emissive: 0xffd166, emissiveIntensity: 0.9 }));
      heart.position.y = 0.07;
      petals.add(heart);
      pad.add(petals);
      const bloom = makeSprite(0xffd6a0, 1.1, 0.24);
      bloom.position.y = 0.12;
      pad.add(bloom);
      life.glows.push({ sprite: bloom, base: 0.24, phase: i * 1.1 });
    }
    group.add(pad);
    life.swayers.push({ object: pad, base: pad.rotation.z, phase: i * 0.7, amount: 0.012 });
  }

  // An islet at the heart with one old lantern tree, the hollow's landmark.
  const islet = new THREE.Group();
  islet.position.set(0, 0, 0);
  const isle = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.35, 12), mat(0x6f6688, { roughness: 0.92, flatShading: true }));
  isle.position.y = 0.16;
  islet.add(isle);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 2.1, 7), mat(0x6d4f80, { roughness: 0.85 }));
  trunk.position.y = 1.3;
  islet.add(trunk);
  for (let i = 0; i < 5; i++) {
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.8 - i * 0.07, 0),
      mat(i % 2 ? 0x54b39a : 0x7fd8b8, { roughness: 0.85, flatShading: true, emissive: 0x3f8c7a, emissiveIntensity: 0.16 })
    );
    const a = (i / 5) * Math.PI * 2;
    blob.position.set(Math.cos(a) * 0.55, 2.3 + (i % 3) * 0.35, Math.sin(a) * 0.55);
    blob.rotation.set(i, i * 1.4, i * 0.6);
    islet.add(blob);
  }
  for (let i = 0; i < 5; i++) {
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      mat(0xffe6b8, { emissive: 0xffb86b, emissiveIntensity: 1.1, roughness: 0.35 })
    );
    const a = (i / 5) * Math.PI * 2 + 0.5;
    fruit.position.set(Math.cos(a) * 0.85, 2.6 + (i % 2) * 0.3, Math.sin(a) * 0.85);
    islet.add(fruit);
  }
  const treeGlow = makeSprite(0xffc88a, 4.2, 0.2);
  treeGlow.position.y = 2.5;
  islet.add(treeGlow);
  life.glows.push({ sprite: treeGlow, base: 0.2, phase: 1.4, slow: true });
  group.add(islet);

  // Reeds at the far rim, each with a soft seed head.
  for (let i = 0; i < 14; i++) {
    const a = 2.1 + (i / 14) * 2.1;
    const r = POND.r + 0.9 + Math.sin(i * 3) * 0.5;
    const reed = new THREE.Group();
    reed.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.1 + (i % 3) * 0.25, 5), mat(0x4f8f7e, { roughness: 0.9 }));
    stem.position.y = 0.55;
    reed.add(stem);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.3, 6), mat(0x8a6f9c, { roughness: 0.85 }));
    head.position.y = 1.1 + (i % 3) * 0.25;
    reed.add(head);
    group.add(reed);
    life.swayers.push({ object: reed, base: reed.rotation.z, phase: i * 0.55, amount: 0.05 });
  }

  return group;
}

function buildStream(island, life) {
  const group = new THREE.Group();
  const path = [
    { x: -2, z: -11 },
    { x: -7, z: -17 },
    { x: -5, z: -24 },
    { x: 2, z: -30 },
    { x: 6, z: -37 },
  ];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const ribbon = new THREE.Mesh(
      new THREE.PlaneGeometry(length + 0.6, 2.3),
      mat(0x3a7f96, { roughness: 0.16, metalness: 0.3, transparent: true, opacity: 0.86 })
    );
    ribbon.rotation.x = -Math.PI / 2;
    ribbon.rotation.z = -Math.atan2(dz, dx);
    const mx = (a.x + b.x) / 2;
    const mz = (a.z + b.z) / 2;
    ribbon.position.set(mx, island.heightAtLocal(mx, mz) + 0.06, mz);
    group.add(ribbon);
  }
  // Stepping stones let a child cross without a jump.
  for (let i = 0; i < 4; i++) {
    const t = 0.18 + i * 0.22;
    const x = -2 + (-7 + 2) * t;
    const z = -11 + (-17 + 11) * t;
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.16, 9), mat(0x9a94b6, { roughness: 0.9, flatShading: true }));
    stone.position.set(x, island.heightAtLocal(x, z) + 0.12, z);
    group.add(stone);
  }
  return group;
}

/** Warm moths over the pond: small, soft, and slow. */
function buildMoths(island, life) {
  const group = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 2 + ((i * 7) % 9);
    const moth = makeSprite(i % 3 === 0 ? 0xfff2b0 : 0xffc07a, 0.42, 0.7);
    moth.position.set(Math.cos(a) * r, 1 + ((i * 5) % 7) * 0.32, Math.sin(a) * r - 4);
    group.add(moth);
    life.moths.push({ sprite: moth, base: moth.position.clone(), phase: i * 0.9, speed: 0.5 + (i % 4) * 0.12 });
  }
  return group;
}

/**
 * The hidden corner: a ring of old stones around a mossy plinth, far from the
 * lantern walk, where the Moon Moth Lantern waits. A child can walk past it a
 * hundred times; nothing marks it but the glow.
 */
export function dressHollowNook(island, at, life) {
  const group = new THREE.Group();
  group.position.set(at.x, island.heightAtLocal(at.x, at.z), at.z);
  const rng = (n) => ((Math.sin(n * 127.1) * 43758.5453) % 1 + 1) % 1;

  const moss = new THREE.Mesh(new THREE.CircleGeometry(1.6, 18), mat(0x3f8c7a, { roughness: 0.95 }));
  moss.rotation.x = -Math.PI / 2;
  moss.position.y = 0.03;
  group.add(moss);

  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const r = 1.9 + rng(i) * 0.3;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.36 + rng(i + 4) * 0.22, 0),
      mat(i % 2 ? 0x7c7ba4 : 0x66688e, { roughness: 0.92, flatShading: true })
    );
    stone.position.set(Math.cos(a) * r, 0.24, Math.sin(a) * r);
    stone.rotation.set(i * 0.8, i * 1.7, i * 0.3);
    stone.scale.set(1, 0.85, 1);
    group.add(stone);
  }
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.32, 10), mat(0x8a86ab, { roughness: 0.88, flatShading: true }));
  plinth.position.y = 0.13;
  group.add(plinth);
  const glow = makeSprite(0xffd6a0, 2.4, 0.2);
  glow.position.y = 0.5;
  group.add(glow);
  life.glows.push({ sprite: glow, base: 0.2, phase: 3.1, slow: true });
  return group;
}

export function dressLanternHollow(island) {
  const life = { swayers: [], glows: [], moths: [] };
  const zone = island.group;
  const pond = buildMoonpetalPond(island, life);
  zone.add(pond);
  zone.add(buildStream(island, life));
  zone.add(buildMoths(island, life));

  // The lantern walk curves gently from the landing to the water's edge.
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = Math.sin(t * 2.4) * 2.1;
    const z = 27 - t * 15;
    zone.add(buildLanternPost(island, x, z, i % 2 ? -1 : 1, i, life));
  }

  // A bench of mossy stone where the walk meets the water.
  const benchY = island.heightAtLocal(0, 10.5);
  const bench = new THREE.Group();
  bench.position.set(0, benchY, 10.5);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 0.7), mat(0x8a86ab, { roughness: 0.9, flatShading: true }));
  seat.position.y = 0.45;
  bench.add(seat);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.6), mat(0x76779c, { roughness: 0.9 }));
    leg.position.set(side * 0.9, 0.2, 0);
    bench.add(leg);
  }
  zone.add(bench);

  return {
    life,
    update(dt, time) {
      for (const s of life.swayers) {
        s.object.rotation.z = s.base + Math.sin(time * 1.1 + s.phase) * s.amount;
      }
      for (const g of life.glows) {
        const p = g.slow ? Math.sin(time * 0.9 + g.phase) * 0.04 : Math.sin(time * 1.6 + g.phase) * 0.05;
        g.sprite.material.opacity = g.base + p;
      }
      for (const m of life.moths) {
        m.sprite.position.set(
          m.base.x + Math.sin(time * m.speed + m.phase) * 0.6,
          m.base.y + Math.sin(time * (m.speed * 1.4) + m.phase * 1.7) * 0.35,
          m.base.z + Math.cos(time * m.speed * 0.8 + m.phase) * 0.6
        );
      }
    },
  };
}

/**
 * A prize niche: three mossy stones around a plinth, with the little object
 * floating above it. The object is returned so the game can hide it once it has
 * been taken, and while a fern curtain still covers it.
 */
export function dressHollowPrize(island, loot) {
  const group = new THREE.Group();
  group.position.set(loot.x, island.heightAtLocal(loot.x, loot.z), loot.z);
  group.rotation.y = Math.atan2(-loot.x, 34 - loot.z);

  const moss = new THREE.Mesh(new THREE.CircleGeometry(1.15, 16), mat(0x3f8c7a, { roughness: 0.95 }));
  moss.rotation.x = -Math.PI / 2;
  moss.position.y = 0.02;
  group.add(moss);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.34, 9), mat(0x8a86ab, { roughness: 0.9, flatShading: true }));
  plinth.position.y = 0.17;
  group.add(plinth);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const stone = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.26 + i * 0.03, 0),
      mat(i % 2 ? 0x7c7ba4 : 0x66688e, { roughness: 0.92, flatShading: true })
    );
    stone.position.set(Math.cos(a) * 0.72, 0.28, Math.sin(a) * 0.72);
    stone.scale.set(0.8, 1.5, 0.8);
    stone.rotation.set(0.2 * i, 1.1 * i, 0.15 * i);
    group.add(stone);
  }
  const item = trophyMesh(loot.kind, loot.colour);
  item.position.y = 0.42;
  item.scale.setScalar(1.25);
  group.add(item);
  const glow = makeSprite(loot.colour, 2.2, 0.26);
  glow.position.y = 0.55;
  group.add(glow);
  return { group, item, glow };
}
