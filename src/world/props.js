import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, clamp } from '../engine/utils.js';
import { glyphTexture, makeSprite, labelTexture } from './textures.js';

const STONE = 0xc9bcd8;
const STONE_DARK = 0x9d8fbd;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.86,
    metalness: opts.metalness ?? 0.02,
    flatShading: true,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
}

// ---------------------------------------------------------------- flora ----

function buildTree(rng, pal) {
  const g = new THREE.Group();
  const h = 2.8 + rng() * 2.6;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.34, h, 6, 1), mat(pal.trunk));
  trunk.position.y = h / 2;
  trunk.rotation.z = (rng() - 0.5) * 0.09;
  g.add(trunk);

  const blobs = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < blobs; i++) {
    const r = 0.95 + rng() * 0.75;
    const geo = new THREE.IcosahedronGeometry(r, 0);
    const color = rng() > 0.5 ? pal.leaf : pal.leafAlt;
    const blob = new THREE.Mesh(geo, mat(color, { emissive: color, emissiveIntensity: 0.06 }));
    blob.position.set((rng() - 0.5) * 1.5, h + 0.25 + rng() * 1.1, (rng() - 0.5) * 1.5);
    blob.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    blob.scale.y = 0.85 + rng() * 0.4;
    g.add(blob);
  }

  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 16),
    new THREE.MeshBasicMaterial({ color: 0x2c2f52, transparent: true, opacity: 0.1, depthWrite: false })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.04;
  g.add(contact);

  // a couple of glowing fruits
  if (rng() > 0.45) {
    for (let i = 0; i < 2; i++) {
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 6),
        mat(0xffd166, { emissive: 0xffb347, emissiveIntensity: 0.9 })
      );
      fruit.position.set((rng() - 0.5) * 2, h - 0.2 + rng() * 1.4, (rng() - 0.5) * 2);
      g.add(fruit);
    }
  }
  return g;
}

function buildCrystal(rng, pal) {
  const g = new THREE.Group();
  const count = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const h = 0.7 + rng() * 1.7;
    const geo = new THREE.OctahedronGeometry(0.3 + rng() * 0.18, 0);
    const mesh = new THREE.Mesh(
      geo,
      mat(pal.crystal, { emissive: pal.crystal, emissiveIntensity: 0.75, roughness: 0.3, metalness: 0.1 })
    );
    mesh.scale.set(1, h / 0.8, 1);
    mesh.position.set((rng() - 0.5) * 0.7, h * 0.45, (rng() - 0.5) * 0.7);
    mesh.rotation.set((rng() - 0.5) * 0.5, rng() * 3, (rng() - 0.5) * 0.5);
    g.add(mesh);
  }
  const glow = makeSprite(pal.crystal, 2.2, 0.22);
  glow.position.y = 0.7;
  g.add(glow);
  return g;
}

function buildMushroom(rng, pal) {
  const g = new THREE.Group();
  const h = 0.5 + rng() * 0.9;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, h, 6), mat(0xfff1dc));
  stem.position.y = h / 2;
  g.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.32 + rng() * 0.14, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(rng() > 0.5 ? pal.accent : 0xff9ec4, { emissive: pal.accent, emissiveIntensity: 0.35 }));
  cap.position.y = h;
  cap.scale.y = 0.78;
  g.add(cap);
  return g;
}

function buildRock(rng) {
  const geo = new THREE.IcosahedronGeometry(0.45 + rng() * 0.7, 0);
  const mesh = new THREE.Mesh(geo, mat(rng() > 0.5 ? 0x9a93b8 : 0x817a9e));
  mesh.scale.set(1 + rng() * 0.5, 0.6 + rng() * 0.5, 1 + rng() * 0.4);
  mesh.rotation.set(rng() * 3, rng() * 3, rng() * 3);
  return mesh;
}

function buildBush(rng, pal) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.4 + rng() * 0.3, 0),
      mat(pal.leafAlt, { emissive: pal.leaf, emissiveIntensity: 0.08 })
    );
    blob.position.set((rng() - 0.5) * 0.7, 0.25 + rng() * 0.25, (rng() - 0.5) * 0.7);
    g.add(blob);
  }
  return g;
}

// ------------------------------------------------------------- scattering ---

export function buildScatter(island, blockers = []) {
  const rng = mulberry32(island.seed + 71);
  const pal = island.zone.palette;
  const R = island.radius;
  const placed = [];
  const zone = island.group;

  const free = (x, z, spacing) => {
    if (Math.hypot(x, z) > R * 0.9) return false;
    for (const b of blockers) {
      if (Math.hypot(x - b.x, z - b.z) < b.r + spacing * 0.8) return false;
    }
    for (const p of placed) {
      if (Math.hypot(x - p.x, z - p.z) < spacing) return false;
    }
    return true;
  };

  const put = (obj, spacing, yOff = 0) => {
    for (let tries = 0; tries < 26; tries++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * R * 0.88;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!free(x, z, spacing)) continue;
      obj.position.set(x, island.heightAtLocal(x, z) + yOff, z);
      obj.rotation.y = rng() * Math.PI * 2;
      zone.add(obj);
      placed.push({ x, z });
      return true;
    }
    return false;
  };

  for (let i = 0; i < 24; i++) put(buildTree(rng, pal), 5.6);
  for (let i = 0; i < 26; i++) put(buildCrystal(rng, pal), 3.2);
  for (let i = 0; i < 18; i++) put(buildMushroom(rng, pal), 2.2);
  for (let i = 0; i < 16; i++) put(buildBush(rng, pal), 2.8);
  for (let i = 0; i < 30; i++) put(buildRock(rng), 2.4, 0.05);

  addGroundCover(island, rng);
}

function addGroundCover(island, rng) {
  const pal = island.zone.palette;
  const R = island.radius;

  // --- grass blades ---
  const bladeGeo = new THREE.ConeGeometry(0.06, 0.44, 3, 1);
  bladeGeo.translate(0, 0.22, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
  const blades = 2600;
  const grass = new THREE.InstancedMesh(bladeGeo, bladeMat, blades);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const cA = new THREE.Color(pal.grassA);
  const cB = new THREE.Color(pal.grassB);
  for (let i = 0; i < blades; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * R * 0.94;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = island.heightAtLocal(x, z);
    dummy.position.set(x, y - 0.05, z);
    dummy.rotation.set((rng() - 0.5) * 0.3, rng() * 3, (rng() - 0.5) * 0.3);
    const s = 0.65 + rng() * 0.9;
    dummy.scale.set(s, s * (0.8 + rng() * 0.7), s);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    color.copy(cA).lerp(cB, rng()).multiplyScalar(0.85 + rng() * 0.25);
    grass.setColorAt(i, color);
  }
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  grass.frustumCulled = true;
  island.group.add(grass);

  // --- flowers: green stems + bright heads ---
  const stemGeo = new THREE.CylinderGeometry(0.018, 0.024, 0.34, 4);
  stemGeo.translate(0, 0.17, 0);
  const headGeo = mergeGeometries([
    new THREE.SphereGeometry(0.085, 6, 5),
    ...[0, 1, 2, 3, 4].map((i) => {
      const petal = new THREE.SphereGeometry(0.055, 5, 4);
      const a = (i / 5) * Math.PI * 2;
      petal.translate(Math.cos(a) * 0.1, 0.34, Math.sin(a) * 0.1);
      return petal;
    }),
  ]);
  const stemMat = new THREE.MeshStandardMaterial({ color: pal.leaf, roughness: 1, flatShading: true });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true });
  const flowers = 620;
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, flowers);
  const heads = new THREE.InstancedMesh(headGeo, headMat, flowers);
  const petalColors = [0xfff1f6, 0xffd166, 0xff9ec4, 0xa8e8ff, 0xd8b8ff, 0xfffaf0];
  const headColor = new THREE.Color();
  for (let i = 0; i < flowers; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * R * 0.9;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = island.heightAtLocal(x, z);
    const s = 0.85 + rng() * 0.8;
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rng() * 3, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    heads.setMatrixAt(i, dummy.matrix);
    headColor.setHex(petalColors[Math.floor(rng() * petalColors.length)]);
    heads.setColorAt(i, headColor);
  }
  stems.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
  island.group.add(stems);
  island.group.add(heads);
}

/** Soft distant islands on the horizon for depth. */
export function buildSkyIslands(scene, zone) {
  const rng = mulberry32(zone.seed + 303);
  const pal = zone.palette;
  const group = new THREE.Group();
  group.position.set(zone.origin.x, 0, zone.origin.z);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rng() * 0.5;
    const dist = 150 + rng() * 90;
    const radius = 8 + rng() * 14;
    const island = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, 1.4, 12, 1), mat(pal.grassB));
    top.position.y = 0;
    island.add(top);
    const rock = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.92, radius * 1.7, 10, 1), mat(pal.edge));
    rock.rotation.x = Math.PI;
    rock.position.y = -radius * 0.9;
    island.add(rock);
    for (let t = 0; t < 3; t++) {
      const tree = buildTree(rng, pal);
      tree.scale.setScalar(1.6 + rng());
      tree.position.set((rng() - 0.5) * radius, 0.6, (rng() - 0.5) * radius);
      island.add(tree);
    }
    island.position.set(Math.cos(a) * dist, -6 + rng() * 26, Math.sin(a) * dist);
    island.rotation.y = rng() * 3;
    group.add(island);
  }
  scene.add(group);
  return group;
}

// ---------------------------------------------------------------- portals ---

export function buildPortal(def) {
  const group = new THREE.Group();
  const accent = new THREE.Color(def.color ?? 0x8fd6ff);

  const archMat = new THREE.MeshStandardMaterial({ color: 0xf3e6ff, roughness: 0.65, flatShading: true });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.36, 8, 30, Math.PI), archMat);
  arch.position.y = 2.8;
  group.add(arch);

  const pillarGeo = new THREE.CylinderGeometry(0.42, 0.55, 2.9, 7);
  for (const sx of [-2.7, 2.7]) {
    const pillar = new THREE.Mesh(pillarGeo, archMat);
    pillar.position.set(sx, 1.45, 0);
    group.add(pillar);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.3, 8), mat(STONE));
    base.position.set(sx, 0.15, 0);
    group.add(base);
  }

  const veilMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const veil = new THREE.Mesh(new THREE.CircleGeometry(2.5, 40, 0, Math.PI), veilMat);
  veil.position.set(0, 2.75, 0);
  group.add(veil);

  const swirl = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.05, 6, 40),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  swirl.position.set(0, 2.75, 0.06);
  group.add(swirl);

  const iconTex = glyphTexture({ kind: 'icon', text: def.icon ?? '✨' });
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex, transparent: true, depthWrite: false }));
  icon.scale.setScalar(1.5);
  icon.position.set(0, 5.9, 0.1);
  group.add(icon);

  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.37),
    new THREE.MeshBasicMaterial({ map: labelTexture(def.label, '#5b4bd6'), transparent: true, depthWrite: false })
  );
  plaque.position.set(0, 4.55, 0.12);
  group.add(plaque);

  const glow = makeSprite(accent, 7, 0.2);
  glow.position.set(0, 2.8, -0.2);
  group.add(glow);

  // A tall, soft beacon so an arch can be spotted across the meadow.
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 1.5, 22, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  beam.position.y = 11;
  group.add(beam);

  return { group, veil, swirl, icon, glow, beam, accent };
}

// ------------------------------------------------------------- wish tree ---

export function buildWishTree(pal) {
  const group = new THREE.Group();
  const trunkMat = mat(0xb08a63);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.75, 9, 8), trunkMat);
  trunk.position.y = 4.5;
  group.add(trunk);

  // bark ridges
  for (let i = 0; i < 3; i++) {
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 7.4, 5), mat(0x97714f));
    const a = (i / 3) * Math.PI * 2;
    ridge.position.set(Math.cos(a) * 1.1, 4.3, Math.sin(a) * 1.1);
    group.add(ridge);
  }

  const canopy = new THREE.Group();
  const blobData = [
    [0, 10.4, 0, 3.2],
    [-2.6, 9.2, 0.8, 2.2],
    [2.5, 9.4, -0.6, 2.4],
    [0.7, 11.6, 1.7, 2],
    [-1.4, 11.2, -1.9, 1.9],
    [2.2, 11.3, 1.9, 1.7],
    [-2.4, 10.6, -1.6, 1.7],
  ];
  for (const [x, y, z, r] of blobData) {
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 0),
      mat(0x7be0a8, { emissive: 0x65d6a0, emissiveIntensity: 0.18 })
    );
    blob.position.set(x, y, z);
    blob.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    canopy.add(blob);
  }
  group.add(canopy);

  // a little stone altar in front of the tree holds the Starberry sockets
  const altar = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 0.7, 10), mat(0xc9bcd8));
  altar.position.set(0, 0.35, 3.4);
  group.add(altar);
  const altarTop = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.14, 10), mat(0x9d8fbd));
  altarTop.position.set(0, 0.76, 3.4);
  group.add(altarTop);

  const sockets = [];
  const SOCKET_COUNT = 5;
  for (let i = 0; i < SOCKET_COUNT; i++) {
    const offset = (i - (SOCKET_COUNT - 1) / 2) * 1.45;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.09, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffc94b, emissiveIntensity: 0.4, roughness: 0.4 })
    );
    ring.position.set(offset, 1.85, 3.4);
    group.add(ring);

    const berry = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xff6f91, emissive: 0xff3d6e, emissiveIntensity: 1.1, roughness: 0.35 })
    );
    berry.position.copy(ring.position);
    berry.visible = false;
    group.add(berry);

    const glow = makeSprite(0xff9ec4, 2.6, 0);
    glow.position.copy(ring.position);
    group.add(glow);

    sockets.push({ ring, berry, glow, offset });
  }

  // drifting motes around the canopy
  const motes = [];
  for (let i = 0; i < 18; i++) {
    const s = makeSprite(0xfff2b0, 0.7 + Math.random() * 0.7, 0.6);
    const a = Math.random() * Math.PI * 2;
    const r = 2.5 + Math.random() * 4;
    s.position.set(Math.cos(a) * r, 7 + Math.random() * 5, Math.sin(a) * r);
    group.add(s);
    motes.push({ sprite: s, phase: Math.random() * 6.28, speed: 0.4 + Math.random() * 0.5, r, a });
  }

  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xfff2b0,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(9, 18, 14), auraMat);
  aura.position.y = 9;
  group.add(aura);

  return { group, sockets, canopy, motes, aura };
}

// -------------------------------------------------------------- stations ---

export function buildStationBase(palette, radius = 2.5) {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.06, 0.42, 10), mat(STONE));
  plinth.position.y = 0.2;
  group.add(plinth);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius * 0.86, 0.1, 10), mat(STONE_DARK));
  top.position.y = 0.45;
  group.add(top);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c9,
    emissive: palette.accent,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.62, 0.07, 6, 36), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.52;
  group.add(ring);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rune = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.16), mat(palette.crystal, { emissive: palette.crystal, emissiveIntensity: 0.5 }));
    rune.position.set(Math.cos(a) * radius * 0.92, 0.45, Math.sin(a) * radius * 0.92);
    rune.rotation.y = a;
    group.add(rune);
  }

  const questionTex = glyphTexture({ kind: 'mystery' });
  const starTex = glyphTexture({ kind: 'icon', text: '⭐' });
  const marker = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: questionTex, transparent: true, depthWrite: false, depthTest: false })
  );
  marker.scale.setScalar(1.5);
  marker.position.y = 5.4;
  marker.renderOrder = 5;
  group.add(marker);

  let glow = makeSprite(palette.accent, 6, 0.12);
  glow.position.y = 0.8;
  group.add(glow);

  // A soft pillar of light so little explorers can spot signs from far away.
  const beaconMat = new THREE.MeshBasicMaterial({
    color: palette.accent,
    transparent: true,
    opacity: 0.11,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 22, 12, 1, true), beaconMat);
  beacon.position.y = 14.5;
  group.add(beacon);

  return {
    group,
    ring,
    ringMat,
    marker,
    glow,
    beacon,
    setSolved() {
      marker.material.map = starTex;
      marker.material.needsUpdate = true;
      marker.scale.setScalar(1.3);
      ringMat.emissive.setHex(0xffc94b);
      ringMat.emissiveIntensity = 0.9;
      glow.material.color.setHex(0xfff2b0);
      glow.material.opacity = 0.28;
      beacon.visible = false;
    },
    update(dt, time) {
      marker.position.y = 5.4 + Math.sin(time * 1.6) * 0.16;
      ring.rotation.z += dt * 0.35;
      glow.material.opacity = 0.1 + Math.sin(time * 1.8) * 0.04 + 0.04;
      beacon.material.opacity = 0.095 + Math.sin(time * 1.3) * 0.03;
    },
  };
}

/** Small floating tile used to show a repeating pattern above a station. */
export function buildPatternTile(spec) {
  const group = new THREE.Group();
  const backing = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 28),
    new THREE.MeshBasicMaterial({ color: 0x232b4a, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide })
  );
  backing.position.z = 0.01;
  group.add(backing);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.02, 1.02),
    new THREE.MeshBasicMaterial({ map: glyphTexture(spec), transparent: true, depthWrite: false, side: THREE.DoubleSide })
  );
  face.position.z = 0.03;
  group.add(face);
  return group;
}
