/**
 * The art for world-embedded puzzles: standing stones that carry a word, a
 * number or a friend's face, and the thing in the world they change — a bramble
 * curtain, a sunken crossing, a sleeping rune path.
 *
 * Everything here is authored geometry from the same families as the islands
 * (flat-shaded stone, moss, vines, paper-lantern light) so a puzzle reads as part
 * of the place, never as a UI element parked in it.
 */

import * as THREE from 'three';
import { glyphTexture, makeSprite } from './textures.js';
import { mergeStatic } from './staticMerge.js';
import { mulberry32 } from '../engine/utils.js';

const _tmpVec = new THREE.Vector3();

const STATE_COLORS = {
  sleep: 0xb9a6d8,
  active: 0xffc94b,
  correct: 0x8dffd0,
  wrong: 0xff8fa3,
  dim: 0x8f97b8,
};

function mat(color, { rough = 0.9, emissive = 0x000000, emissiveIntensity = 1 } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: 0.02,
    flatShading: true,
    emissive,
    emissiveIntensity,
  });
}

/**
 * One standing stone with a face a child can read from a few metres. It turns to
 * face the player like a friendly signpost, but it is planted in the ground with
 * a mossy foot and a ring of chipped stones.
 */
function buildChoiceStone(choice, accent) {
  const group = new THREE.Group();
  const stoneMat = mat(0x8a86a8);
  const mossMat = mat(0x5f9c74, { rough: 0.98 });

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.24, 7), stoneMat);
  foot.position.y = 0.12;
  group.add(foot);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    const chip = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + (i % 2) * 0.05, 0), mat(0x77739a));
    chip.position.set(Math.cos(a) * 0.7, 0.14, Math.sin(a) * 0.7);
    chip.scale.set(1, 0.7, 1);
    chip.rotation.y = a;
    group.add(chip);
  }

  const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 1.9, 5), stoneMat);
  slab.position.y = 1.16;
  slab.rotation.y = 0.32;
  group.add(slab);
  const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 0), mossMat);
  cap.position.y = 2.1;
  cap.scale.set(1, 0.5, 1);
  group.add(cap);

  // A pale stone frame holds a slate inset: the same carved-sign language as the
  // learning boards, and enough contrast for a cream word to read at distance.
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.02, 2.02, 0.2), mat(0xb6b0cc, { rough: 0.8 }));
  frame.position.set(0, 1.32, 0.42);
  group.add(frame);
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.68, 0.12), mat(0x2f3a5e, { rough: 0.55 }));
  plaque.position.set(0, 1.32, 0.55);
  group.add(plaque);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.035, 6, 26), mat(0x8dffd0, { rough: 0.4 }));
  trim.position.set(0, 1.32, 0.62);
  group.add(trim);
  const faceMat = new THREE.MeshBasicMaterial({
    map: glyphTexture(choice.glyph),
    transparent: true,
    depthWrite: false,
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), faceMat);
  face.position.set(0, 1.32, 0.63);
  face.renderOrder = 3;
  group.add(face);

  const glow = makeSprite(STATE_COLORS.sleep, 2.6, 0.06);
  glow.position.set(0, 1.35, 0.4);
  group.add(glow);

  const stone = {
    id: choice.id,
    choice,
    group,
    state: 'sleep',
    face,
    faceMat,
    glow,
    shake: 0,
    pop: 0,
    accent,
    setState(next) {
      if (this.state === next) return;
      this.state = next;
      if (next === 'wrong') this.shake = 1;
      if (next === 'correct') this.pop = 1;
      const color = STATE_COLORS[next] ?? STATE_COLORS.sleep;
      this.glow.material.color.setHex(color);
      this.faceMat.opacity = next === 'dim' ? 0.16 : next === 'sleep' ? 0.62 : 1;
    },
    worldPoint(out = new THREE.Vector3()) {
      this.group.updateWorldMatrix(true, false);
      const point = this.group.getWorldPosition(out);
      return point.setY(point.y + 1.35);
    },
    update(dt, time, camera, calm) {
      const g = this.group;
      if (camera) {
        // g.position is island-local; the camera is in world space. Use the
        // true world position or the stone faces the wrong way.
        const world = g.getWorldPosition(_tmpVec);
        g.rotation.y = Math.atan2(camera.position.x - world.x, camera.position.z - world.z);
      }
      // A waking stone leans toward the player and breathes; a dim one lies low.
      const awake = this.state === 'active' || this.state === 'correct';
      const targetScale = this.state === 'dim' ? 0.9 : this.state === 'sleep' ? 0.97 : 1;
      const bob = awake && !calm ? Math.sin(time * 1.6 + g.position.x) * 0.035 : 0;
      this.pop = Math.max(0, this.pop - dt * 2);
      g.scale.setScalar(targetScale + this.pop * 0.06);
      g.position.y = this.baseY + bob;
      if (this.shake > 0) {
        this.shake = Math.max(0, this.shake - dt * 1.8);
        g.rotation.z = Math.sin(time * 40) * this.shake * 0.06;
      } else {
        g.rotation.z = 0;
      }
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.4 + g.position.z);
      this.glow.material.opacity = this.state === 'active' ? 0.16 + pulse * 0.14
        : this.state === 'correct' ? 0.5 + pulse * 0.1
          : this.state === 'dim' ? 0.02 : 0.05;
    },
  };
  stone.baseY = group.position.y;
  stone.setState('sleep');
  return stone;
}

/** A short bramble curtain that can curl away when its word is read. */
function buildBramble(width = 4.6, height = 3.8, accent = 0x8dffd0) {
  const group = new THREE.Group();
  const rng = mulberry32(3611);
  const vineMat = mat(0x5b4a6e, { rough: 0.92 });
  const vines = [];
  for (let i = 0; i < 8; i++) {
    const t = (i / 7) * 2 - 1;
    const h = height - 0.3 + rng() * 0.5;
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, h, 5), vineMat);
    vine.position.set(t * (width / 2 - 0.1), h / 2, 0.1);
    vine.userData.h = h;
    vine.rotation.z = t * 0.16 + (rng() - 0.5) * 0.08;
    group.add(vine);
    vines.push(vine);
  }
  const leaves = [];
  for (let i = 0; i < 34; i++) {
    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.14 + rng() * 0.13, 0),
      mat(i % 5 === 0 ? 0x7f6396 : 0x4f7f74, { rough: 0.95 })
    );
    leaf.position.set((rng() * 2 - 1) * (width / 2 - 0.1), 0.4 + rng() * (height - 1), (rng() - 0.5) * 0.5);
    leaf.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    leaf.scale.set(1.25, 0.4, 0.9);
    group.add(leaf);
    leaves.push(leaf);
  }
  const buds = [];
  for (const side of [-1, 1]) {
    const bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      mat(accent, { emissive: accent, emissiveIntensity: 0.5, rough: 0.5 })
    );
    bud.scale.set(1, 1.35, 1);
    bud.position.set(side * (width / 2 - 0.5), height * 0.62 + rng() * 0.3, 0.25);
    group.add(bud);
    buds.push(bud);
  }
  return { group, vines, leaves, buds };
}

function buildBrambleThicket(width, height, accent, rng) {
  const group = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const t = (i / 6) * 2 - 1;
    const mound = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.9 + rng() * 0.5, 0),
      mat(i % 3 === 0 ? 0x4f7f74 : 0x5b6f8e)
    );
    mound.position.set(t * width * 0.45, 0.55 + rng() * 0.6, (rng() - 0.5) * 1.1);
    mound.scale.set(1.2, 1.1 + rng() * 0.7, 1);
    group.add(mound);
  }
  for (let i = 0; i < 10; i++) {
    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2 + rng() * 0.16, 0),
      mat(i % 4 === 0 ? 0x7f6396 : 0x4f7f74)
    );
    leaf.position.set((rng() - 0.5) * width, 0.9 + rng() * (height - 1), (rng() - 0.5) * 0.9);
    leaf.scale.set(1.3, 0.4, 0.9);
    leaf.rotation.set(rng() * 2, rng() * 3, rng() * 2);
    group.add(leaf);
  }
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(accent, { emissive: accent, emissiveIntensity: 0.6 }));
  bud.position.set(width * 0.18, height * 0.7, 0.5);
  group.add(bud);
  return group;
}

/** A ring of hedge or moonflower that makes a pocket a real place, not a backdrop. */
function buildPocketRing(island, def, style, accent, rng) {
  const group = new THREE.Group();
  const pocket = def.pocket;
  if (!pocket) return group;
  const cy = island.heightAtLocal(pocket.x, pocket.z);
  const gateAngle = Math.atan2(def.at.x - pocket.x, def.at.z - pocket.z);
  const segments = style === 'moon' ? 16 : 18;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    let delta = Math.abs(((a - gateAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (delta < 0.34) continue;
    const r = pocket.r + 0.4;
    const x = pocket.x + Math.sin(a) * r;
    const z = pocket.z + Math.cos(a) * r;
    const y = island.heightAtLocal(x, z);
    if (style === 'cove') {
      const coral = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.4, 6), mat(0xffb3c9, { rough: 0.7 }));
      stem.position.y = 0.7;
      coral.add(stem);
      for (let b = 0; b < 3; b++) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.9, 5), mat(b % 2 ? 0xff9ec4 : 0xffd0c0, { rough: 0.7 }));
        arm.position.set((b - 1) * 0.35, 1.35 + b * 0.12, 0);
        arm.rotation.z = (b - 1) * 0.45;
        coral.add(arm);
        const tip = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), mat(0x9ffff0, { emissive: 0x5fe0c0, emissiveIntensity: 0.45 }));
        tip.position.set((b - 1) * 0.55, 1.8 + b * 0.12, 0);
        coral.add(tip);
      }
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), mat(0x8bbfc4));
      rock.position.set(0.6, 0.3, 0.3);
      rock.scale.set(1, 0.55, 1);
      coral.add(rock);
      coral.position.set(x, y, z);
      coral.rotation.y = a;
      group.add(coral);
    } else if (style === 'moon') {
      const bush = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.9, 5), mat(0x4c6b86));
      stem.position.y = 0.95;
      bush.add(stem);
      const bloom = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 0),
        mat(0xffe3f1, { emissive: 0xffb7d6, emissiveIntensity: 0.5, rough: 0.6 })
      );
      bloom.position.y = 1.95;
      bloom.scale.set(1.2, 0.75, 1.2);
      bush.add(bloom);
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat(0x6bb89a));
      leaf.position.set(0.3, 1.1, 0.05);
      leaf.scale.set(1.2, 0.3, 0.7);
      bush.add(leaf);
      bush.position.set(x, y, z);
      group.add(bush);
    } else {
      const mound = buildBrambleThicket(3.1, 2.2, accent, rng);
      mound.position.set(x, y, z);
      mound.rotation.y = a;
      group.add(mound);
    }
  }
  // The inside: a soft floor, a seat or moonwell, and flowers that only exist
  // once a child can walk in.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(pocket.r - 0.6, 28),
    new THREE.MeshStandardMaterial({ color: style === 'moon' ? 0x6fa89a : 0x7fbf79, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(pocket.x, cy + 0.06, pocket.z);
  group.add(floor);
  const centre = new THREE.Group();
  centre.position.set(pocket.x + Math.sin(gateAngle) * 1.2, cy, pocket.z + Math.cos(gateAngle) * 1.2);
  if (style === 'cove') {
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(pocket.r * 0.62, 30),
      new THREE.MeshStandardMaterial({ color: 0x63d6e8, roughness: 0.12, metalness: 0.08, transparent: true, opacity: 0.88 })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.26;
    centre.add(pool);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.5;
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xfff1c8, { emissive: 0xffd166, emissiveIntensity: 0.7 }));
      pearl.position.set(Math.cos(a) * pocket.r * 0.4, 0.38, Math.sin(a) * pocket.r * 0.4);
      centre.add(pearl);
    }
  } else if (style === 'moon') {
    const well = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.4, 12), mat(0x8b87aa));
    well.position.y = 0.2;
    centre.add(well);
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1.02, 26),
      new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.43;
    centre.add(water);
    const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), mat(0xfff1c8, { emissive: 0xffd166, emissiveIntensity: 1.1 }));
    moon.position.y = 1.1;
    moon.scale.set(1, 1, 0.55);
    centre.add(moon);
    const light = makeSprite(0xffe6b0, 3.6, 0.34);
    light.position.y = 1.1;
    centre.add(light);
  } else {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 0.7), mat(0x8b87aa));
    seat.position.y = 0.55;
    centre.add(seat);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.55, 5), mat(0x77739a));
      leg.position.set(side * 0.8, 0.27, 0);
      centre.add(leg);
    }
    const marker = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), mat(0x9a96b8));
    marker.position.set(0, 0.35, -1.1);
    marker.scale.set(1, 0.7, 1);
    centre.add(marker);
  }
  group.add(centre);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.4;
    const rr = pocket.r * 0.55;
    const x = pocket.x + Math.cos(a) * rr;
    const z = pocket.z + Math.sin(a) * rr;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.5, 4), mat(0x4f9a6a));
    stem.position.set(x, island.heightAtLocal(x, z) + 0.25, z);
    group.add(stem);
    const bloom = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.11, 0),
      mat(style === 'moon' ? 0xd8c7ff : 0xffd8a8, { emissive: style === 'moon' ? 0x8f6cf0 : 0xffb86b, emissiveIntensity: 0.55 })
    );
    bloom.position.set(x, island.heightAtLocal(x, z) + 0.52, z);
    group.add(bloom);
  }
  return group;
}

/** A curtain of pale moth wings for the hollow's moonword. */
function buildMothCurtain(width, height) {
  const group = new THREE.Group();
  const rng = mulberry32(9021);
  const wings = [];
  // A shimmering veil behind the wings, so the curtain reads as a curtain and
  // its lifting is unmistakable from the path.
  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.92, height * 0.82),
    new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false })
  );
  veil.position.set(0, height * 0.45, 0.05);
  veil.renderOrder = 2;
  group.add(veil);
  for (let i = 0; i < 34; i++) {
    const wing = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.24 + rng() * 0.18, 0),
      mat(i % 3 === 0 ? 0xfff1d0 : 0xd8c7ff, { emissive: 0xffd9a0, emissiveIntensity: 0.45, rough: 0.7 })
    );
    wing.position.set((rng() * 2 - 1) * (width / 2 - 0.25), 0.5 + rng() * (height - 1), (rng() - 0.5) * 0.5);
    wing.scale.set(1.7, 0.34, 0.9);
    wing.rotation.set(rng() * 2, rng() * 3, rng() * 2);
    group.add(wing);
    wings.push(wing);
  }
  const glow = makeSprite(0xffe6b0, 3.2, 0.16);
  glow.position.set(0, height * 0.55, 0.5);
  group.add(glow);
  return { group, wings };
}

function buildVeilGate(island, def, accent) {
  const root = new THREE.Group();
  const moon = def.veil === 'moths';
  const stoneMat = mat(moon ? 0x9d96c8 : 0x8b87aa);
  const cluster = new THREE.Group();
  cluster.position.set(def.at.x, island.heightAtLocal(def.at.x, def.at.z), def.at.z);
  // Face the way a child arrives, so the curtain reads across the path.
  cluster.rotation.y = Math.atan2(def.faceTo.x - def.at.x, def.faceTo.z - def.at.z);
  root.add(cluster);

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 4.3, 6), stoneMat);
    post.position.set(side * 2.5, 2.15, 0);
    post.rotation.z = side * 0.05;
    cluster.add(post);
    const foot = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), mat(moon ? 0x8780b4 : 0x77739a));
    foot.position.set(side * 2.5, 0.2, 0);
    foot.scale.set(1.1, 0.5, 1.1);
    cluster.add(foot);
    const moss = new THREE.SphereGeometry(0.3, 8, 6);
    const tuft = new THREE.Mesh(moss, mat(moon ? 0x5f7f9c : 0x5f9c74));
    tuft.position.set(side * 2.5, 0.55, 0.35);
    tuft.scale.set(1.2, 0.4, 1);
    cluster.add(tuft);
  }
  const lintel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 5.9, 6), stoneMat);
  lintel.position.y = 4.35;
  lintel.rotation.z = Math.PI / 2;
  cluster.add(lintel);
  const capstone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mat(moon ? 0xb6b0d8 : 0x9a96b8));
  capstone.position.y = 4.7;
  capstone.scale.set(1.8, 0.6, 1);
  cluster.add(capstone);

  const curtain = moon ? buildMothCurtain(4.6, 3.7) : buildBramble(4.7, 3.7, accent);
  const curtainGroup = curtain.group;
  curtainGroup.position.y = 0.05;
  cluster.add(curtainGroup);

  const glint = makeSprite(moon ? 0xffe6b0 : accent, 3.4, 0.1);
  glint.position.set(0, 2.2, 0.6);
  cluster.add(glint);
  mergeStatic(cluster, { keep: [curtainGroup], tag: 'gate-stone-static' });

  // The place the gate was hiding: a real pocket with its own floor, flowers and
  // a seat or moonwell. A hedge/moonflower ring surrounds it, so the curtain is
  // the only way in.
  const rng = mulberry32(moon ? 7127 : 3612);
  const pocket = buildPocketRing(island, def, moon ? 'moon' : 'bramble', accent, rng);
  mergeStatic(pocket, { tag: 'pocket-static' });
  root.add(pocket);

  let retract = 0;
  let target = 0;
  const blockPlayer = (pos) => {
    if (solved || !def.pocket) return null;
    const ox = island.zone.origin.x + def.pocket.x;
    const oz = island.zone.origin.z + def.pocket.z;
    const dx = pos.x - ox;
    const dz = pos.z - oz;
    const d = Math.hypot(dx, dz);
    const r = def.pocket.r - 0.5;
    if (d >= r) return null;
    // Dead centre has no outward direction; push toward the gate instead.
    if (d < 0.01) {
      const gx = def.at.x - def.pocket.x;
      const gz = def.at.z - def.pocket.z;
      const gl = Math.hypot(gx, gz) || 1;
      return { x: ox + (gx / gl) * r, z: oz + (gz / gl) * r };
    }
    const scale = r / d;
    return { x: ox + dx * scale, z: oz + dz * scale };
  };
  let solved = false;

  return {
    group: root,
    glint,
    blockPlayer,
    open(animate) {
      solved = true;
      target = 1;
      if (!animate) retract = 1;
      if (retract >= 1) curtainGroup.visible = false;
    },
    update(dt, time, calm) {
      if (retract !== target) {
        retract = Math.min(target, retract + dt * 0.85);
        curtainGroup.visible = retract < 1;
        const ease = retract * retract;
        curtainGroup.scale.set(1 + ease * 0.1, Math.max(0.02, 1 - ease), 1);
        curtainGroup.position.y = 0.05 - ease * 0.5;
        if (!moon) for (const bud of curtain.buds) bud.material.emissiveIntensity = 0.5 + ease * 1.2;
      }
      const pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(time * 1.5);
      glint.material.opacity = target > 0 ? 0.1 + pulse * 0.05 : 0.06 + pulse * 0.06;
      glint.material.color.setHex(target > 0 ? (moon ? 0xffe6b0 : 0x8dffd0) : accent);
      const size = target > 0 ? 5.2 : 3.4;
      glint.scale.set(size, size * 0.8, 1);
    },
  };
}

function buildCountCrossing(island, def, accent, palette) {
  const root = new THREE.Group();
  const base = new THREE.Group();
  const gy = island.heightAtLocal(def.at.x, def.at.z);
  base.position.set(def.at.x, gy, def.at.z);
  base.rotation.y = Math.atan2(def.faceTo.x - def.at.x, def.faceTo.z - def.at.z);
  root.add(base);

  // A brook: one soft disc with a pale shallow ring, so it reads as water at a
  // glance and never as a hole in the world.
  const water = new THREE.Mesh(new THREE.CircleGeometry(5.1, 40), new THREE.MeshStandardMaterial({
    color: 0x4aa9d8,
    roughness: 0.16,
    metalness: 0.12,
    transparent: true,
    opacity: 0.82,
  }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.34;
  base.add(water);
  const shallow = new THREE.Mesh(new THREE.RingGeometry(3.4, 5.05, 40), new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false,
  }));
  shallow.rotation.x = -Math.PI / 2;
  shallow.position.y = 0.37;
  base.add(shallow);

  const rng = mulberry32(4721);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rng() * 0.2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + rng() * 0.2, 0), mat(i % 2 ? 0x7d88a8 : 0x8d96b4));
    rock.position.set(Math.cos(a) * 5.05, 0.38, Math.sin(a) * 5.05);
    rock.scale.set(1, 0.55, 1);
    rock.rotation.y = a;
    base.add(rock);
  }

  // Six lily flowers: the countable group. Big and spaced enough to count with a
  // finger, and they bob very gently.
  const lilies = [];
  const spots = [
    [-2.1, 1.2], [-0.6, 2.1], [1.3, 2.0], [2.4, 0.9], [1.1, -0.9], [-1.1, -1.4],
  ];
  for (let i = 0; i < spots.length; i++) {
    const lily = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.05, 9), mat(0x5aa87a, { rough: 0.8 }));
    lily.add(pad);
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat(0xffe3f1, { emissive: 0xffb7d6, emissiveIntensity: 0.35, rough: 0.6 }));
      petal.position.set(Math.cos(a) * 0.18, 0.09, Math.sin(a) * 0.18);
      petal.scale.set(1, 0.5, 0.7);
      lily.add(petal);
    }
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0xffd166, { emissive: 0xffb86b, emissiveIntensity: 0.9 }));
    heart.position.y = 0.12;
    lily.add(heart);
    lily.position.set(spots[i][0], 0.41, spots[i][1]);
    base.add(lily);
    lilies.push(lily);
  }

  // The crossing itself: five stones asleep below the waterline.
  const stones = [];
  for (let i = 0; i < 5; i++) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.26, 7), mat(i % 2 ? 0x9aa2bd : 0x8b93b0));
    const z = -2.4 + i * 1.35;
    stone.position.set(0.2 - i * 0.06, -1.35, z);
    stone.userData.restY = -1.35;
    stone.userData.riseY = 0.5 + (i % 2) * 0.05;
    stone.rotation.y = 0.4 * i;
    base.add(stone);
    stones.push(stone);
  }

  // A lookout on the far bank: a small lantern post and two reeds.
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.2, 5), mat(0x6b5a4a));
  post.position.set(-1.6, 1.1, 3.4);
  base.add(post);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0xffe6b0, { emissive: 0xffc56b, emissiveIntensity: 0.9, rough: 0.4 }));
  lantern.scale.y = 1.35;
  lantern.position.set(-1.6, 2.3, 3.4);
  base.add(lantern);

  let risen = 0;
  let target = 0;
  return {
    group: root,
    water,
    open(animate) {
      target = 1;
      if (!animate) risen = 1;
    },
    update(dt, time, calm) {
      if (risen !== target) risen = Math.min(target, risen + dt * 0.75);
      stones.forEach((stone, i) => {
        const local = Math.max(0, Math.min(1, risen * 1.6 - i * 0.12));
        const ease = local * local * (3 - 2 * local);
        stone.position.y = stone.userData.restY + (stone.userData.riseY - stone.userData.restY) * ease;
      });
      lilies.forEach((lily, i) => {
        lily.position.y = 0.41 + (calm ? 0 : Math.sin(time * 1.1 + i * 1.3) * 0.03);
      });
    },
  };
}

function buildRunePath(island, def, accent) {
  const root = new THREE.Group();
  const base = new THREE.Group();
  const gy = island.heightAtLocal(def.at.x, def.at.z);
  base.position.set(def.at.x, gy, def.at.z);
  base.rotation.y = Math.atan2(def.faceTo.x - def.at.x, def.faceTo.z - def.at.z);
  root.add(base);

  const away = new THREE.Vector3(-def.at.x, 0, -def.at.z).normalize();
  const runes = [];
  for (let i = 0; i < 6; i++) {
    const d = 1.6 + i * 1.1;
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.6, 0.12, 8), mat(0x7d88a8, { rough: 0.8 }));
    slab.position.set(away.x * d * 0.5 + Math.sin(i) * 0.5, 0.07, away.z * d * 0.5 + Math.cos(i * 0.7) * 0.5);
    base.add(slab);
    const glyphMat = new THREE.MeshBasicMaterial({ color: 0x7a6d9a, transparent: true, opacity: 0.5, depthWrite: false });
    const glyph = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 18), glyphMat);
    glyph.rotation.x = -Math.PI / 2;
    glyph.position.copy(slab.position);
    glyph.position.y = 0.14;
    base.add(glyph);
    const glow = makeSprite(accent, 1.4, 0.04);
    glow.position.copy(glyph.position);
    glow.position.y += 0.15;
    base.add(glow);
    runes.push({ slab, glyph, glyphMat, glow });
  }

  // Two low stones at the mouth, and a sleeping arch of light between them.
  for (const side of [-1, 1]) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), mat(0x8b87aa));
    stone.position.set(side * 1.35, 0.3, -0.3);
    stone.scale.set(1, 1.3, 0.8);
    base.add(stone);
  }
  const veil = makeSprite(accent, 2.4, 0.0);
  veil.position.set(0, 1.2, -0.3);
  base.add(veil);

  let wake = 0;
  let target = 0;
  return {
    group: root,
    open(animate) {
      target = 1;
      if (!animate) wake = 1;
    },
    update(dt, time, calm) {
      if (wake !== target) wake = Math.min(target, wake + dt * 0.55);
      runes.forEach((rune, i) => {
        const lit = Math.max(0, Math.min(1, wake * 1.15 - i * 0.12));
        const pulse = calm ? 0.6 : 0.6 + 0.4 * Math.sin(time * 2 + i);
        rune.glyphMat.color.setHex(lit > 0.5 ? 0x8dffd0 : 0x7a6d9a);
        rune.glyphMat.opacity = 0.45 + lit * 0.55;
        rune.glow.material.opacity = lit * (0.12 + pulse * 0.14);
      });
      veil.material.opacity = Math.max(0, (1 - wake) * 0.05);
    },
  };
}

/**
 * Build one puzzle in its island. Returns the object the game talks to: the
 * stones to aim at, the mechanism to open, and a frame update.
 */
/** A small framed glyph tile, used by the pattern board and its sockets. */
function buildGlyphTile(glyph, size = 0.76, accent = 0x8dffd0) {
  const group = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(size, size, 0.13), mat(0x2f3a5e, { rough: 0.6 }));
  group.add(back);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(size * 0.53, 0.022, 5, 4), mat(accent, { rough: 0.5 }));
  edge.rotation.z = Math.PI / 4;
  edge.position.z = 0.07;
  group.add(edge);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 0.94, size * 0.94),
    new THREE.MeshBasicMaterial({ map: glyphTexture(glyph), transparent: true, depthWrite: false })
  );
  face.position.z = 0.08;
  face.renderOrder = 3;
  group.add(face);
  return { group, face, edge };
}

/**
 * The Humming Lift: a pattern carved over an arch, three sockets and a stone
 * deck. Each correct shape in the sequence lights a socket and a lamp; when the
 * row is finished the deck becomes a lift and carries a standing child up to a
 * shelf that cannot be reached any other way.
 */
function buildPatternLift(island, def, accent) {
  const root = new THREE.Group();
  const away = new THREE.Vector3(def.at.x - def.faceTo.x, 0, def.at.z - def.faceTo.z).normalize();
  const side = new THREE.Vector3(away.z, 0, -away.x);
  const origin = island.zone.origin;
  const gy = island.heightAtLocal(def.at.x, def.at.z);
  const base = new THREE.Group();
  base.position.set(def.at.x, gy, def.at.z);
  root.add(base);

  // A fixed plinth under the floating deck, so the lift has a home.
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.65, 0.5, 10), mat(0x8b87aa));
  plinth.position.y = 0.25;
  base.add(plinth);
  const inlay = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.85, 24),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.52;
  base.add(inlay);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const chip = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), mat(0x77739a));
    chip.position.set(Math.cos(a) * 2.5, 0.22, Math.sin(a) * 2.5);
    chip.scale.set(1, 0.6, 1);
    base.add(chip);
  }

  // The deck: a rune-lit disc that rises with the child standing on it.
  const DECK_REST = 0.18;
  const DECK_TOP = 5.55;
  const deck = new THREE.Group();
  deck.position.y = DECK_REST;
  base.add(deck);
  const deckDisc = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.85, 0.3, 12), mat(0x9a96b8));
  deckDisc.position.y = 0.15;
  deck.add(deckDisc);
  const deckRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.055, 6, 30), mat(accent, { emissive: accent, emissiveIntensity: 0.5 }));
  deckRing.rotation.x = Math.PI / 2;
  deckRing.position.y = 0.31;
  deck.add(deckRing);
  const deckLamps = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.6;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.05, 5), mat(0x7d78a0));
    post.position.set(Math.cos(a) * 1.55, 0.82, Math.sin(a) * 1.55);
    deck.add(post);
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), mat(0x6f6a94, { emissive: accent, emissiveIntensity: 0 }));
    gem.position.set(Math.cos(a) * 1.55, 1.4, Math.sin(a) * 1.55);
    deck.add(gem);
    deckLamps.push(gem);
  }

  // The arch behind the deck carries the pattern, facing the arrival path.
  const arch = new THREE.Group();
  arch.position.copy(away.clone().multiplyScalar(3.4));
  arch.rotation.y = Math.atan2(-away.x, -away.z);
  base.add(arch);
  const archStone = mat(0x8b87aa);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 4.6, 6), archStone);
    post.position.set(s * 2.7, 2.3, 0);
    arch.add(post);
    const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), mat(0x9a96b8));
    cap.position.set(s * 2.7, 4.65, 0);
    cap.scale.set(1.2, 0.6, 1);
    arch.add(cap);
  }
  const lintel = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 6.0, 6), archStone);
  lintel.position.y = 4.55;
  lintel.rotation.z = Math.PI / 2;
  arch.add(lintel);
  const curl = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 6, 16, Math.PI), mat(0xb6b0cc));
  curl.position.set(0, 4.95, 0);
  arch.add(curl);
  // Raised band holding the row, like a carved sign on the arch.
  const band = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.16, 0.16), mat(0x6f6a94));
  band.position.y = 3.3;
  arch.add(band);
  const row = def.pattern ?? [];
  const rowTiles = [];
  for (let i = 0; i < row.length; i++) {
    const tile = buildGlyphTile(row[i], 0.74, accent);
    tile.group.position.set((i - (row.length - 1) / 2) * 0.86, 3.62, 0.1);
    arch.add(tile.group);
    rowTiles.push(tile);
  }
  // The three sockets underneath: empty until each step is earned.
  const sockets = [];
  const sequence = def.sequence ?? [];
  for (let i = 0; i < sequence.length; i++) {
    const glyph = def.choices.find((c) => c.id === sequence[i])?.glyph ?? { kind: 'icon', text: '⭐' };
    const tile = buildGlyphTile(glyph, 0.68, accent);
    tile.group.position.set((i - (sequence.length - 1) / 2) * 0.9, 2.5, 0.1);
    tile.face.visible = false;
    tile.edge.visible = false;
    arch.add(tile.group);
    sockets.push(tile);
  }
  const archGlow = makeSprite(accent, 3.6, 0.08);
  archGlow.position.set(0, 3.1, 0.5);
  arch.add(archGlow);

  // The sky shelf: floating stone with a shrine, a crystal and drifting motes.
  const shelfLocal = { x: away.x * 8.2, z: away.z * 8.2 };
  const shelf = new THREE.Group();
  shelf.position.set(shelfLocal.x, 0, shelfLocal.z);
  base.add(shelf);
  const shelfTop = gy + 5.85;
  const shelfDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.0, 0.7, 12), mat(0x9a96b8));
  shelfDisc.position.y = 5.5;
  shelf.add(shelfDisc);
  const shelfUnder = new THREE.Mesh(new THREE.ConeGeometry(2.7, 3.4, 9), mat(0x7d78a0));
  shelfUnder.position.y = 3.5;
  shelfUnder.rotation.x = Math.PI;
  shelf.add(shelfUnder);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), mat(i % 2 ? 0x77739a : 0x8b87aa));
    rock.position.set(Math.cos(a) * 3.25, 5.9, Math.sin(a) * 3.25);
    rock.scale.set(1, 0.6, 1);
    shelf.add(rock);
  }
  const shrine = new THREE.Group();
  shrine.position.set(0, 6.2, 0);
  shelf.add(shrine);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 1.5, 5), mat(0xb6b0cc));
    post.position.set(s * 0.7, 0.75, 0);
    shrine.add(post);
  }
  const shrineTop = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.07, 5, 14, Math.PI), mat(0xd8c7ff));
  shrineTop.position.y = 1.5;
  shrine.add(shrineTop);
  const crystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 0),
    mat(0xfff1c8, { emissive: 0xffd166, emissiveIntensity: 1.0, rough: 0.2 })
  );
  crystal.position.y = 1.0;
  shrine.add(crystal);
  const crystalLight = makeSprite(0xffe6b0, 1.7, 0.22);
  crystalLight.position.y = 1.0;
  shrine.add(crystalLight);
  const motes = [];
  for (let i = 0; i < 7; i++) {
    const mote = makeSprite(0x9ad8ff, 0.55, 0.5);
    const a = (i / 7) * Math.PI * 2;
    mote.position.set(Math.cos(a) * (1.5 + (i % 3) * 0.5), 6.5 + (i % 4) * 0.35, Math.sin(a) * 1.6);
    mote.userData.baseY = mote.position.y;
    shelf.add(mote);
    motes.push(mote);
  }

  // A narrow bridge from the raised deck to the shelf.
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.5), mat(0xa8a2c4));
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(away.x * 3.45, 5.78, away.z * 3.45);
  bridgeGroup.rotation.y = Math.atan2(-away.z, away.x);
  bridgeGroup.add(bridge);
  const bridgeRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.07, 0.07), mat(accent, { emissive: accent, emissiveIntensity: 0.4 }));
  bridgeRail.position.set(0, 0.12, 0.68);
  bridgeGroup.add(bridgeRail);
  base.add(bridgeGroup);

  let functional = false;
  let playerY = -Infinity;
  let playerX = 0;
  let playerZ = 0;
  const surfaceAt = (wx, wz) => {
    const lx = wx - (origin.x + def.at.x);
    const lz = wz - (origin.z + def.at.z);
    const deckTop = gy + deck.position.y + 0.3;
    // Only a child who is on (or stepping onto) the deck gets its floor; nobody
    // walking underneath a raised deck is quietly teleported upward.
    if (Math.hypot(lx, lz) <= 2.05) {
      if (deck.position.y < 1.0 || Math.abs(playerY - deckTop) < 1.5) return deckTop;
    }
    if (playerY < gy + 4.2) return null;
    const sx = lx - away.x * 8.2;
    const sz = lz - away.z * 8.2;
    if (Math.hypot(sx, sz) <= 3.35) return shelfTop;
    const along = lx * away.x + lz * away.z;
    const lat = lx * side.x + lz * side.z;
    if (along > 1.55 && along < 5.25 && Math.abs(lat) < 0.85) return shelfTop;
    return null;
  };

  return {
    group: root,
    deck,
    applyStep(count) {
      for (let i = 0; i < sockets.length; i++) {
        sockets[i].face.visible = i < count;
        sockets[i].edge.visible = i < count;
      }
      for (let i = 0; i < deckLamps.length; i++) {
        deckLamps[i].material.emissiveIntensity = i < count ? 1.1 : 0;
      }
    },
    open(animate) {
      functional = true;
      this.applyStep(sequence.length);
    },
    surfaceAt,
    update(dt, time, camera, calm, player) {
      if (player) {
        playerX = player.x;
        playerZ = player.z;
        playerY = player.y;
      }
      const lx = playerX - (origin.x + def.at.x);
      const lz = playerZ - (origin.z + def.at.z);
      const deckTop = gy + deck.position.y + 0.3;
      const onDeck = Math.hypot(lx, lz) < 2.0 && Math.abs(playerY - deckTop) < 1.5;
      const want = functional && onDeck ? DECK_TOP : DECK_REST;
      if (deck.position.y < want) deck.position.y = Math.min(want, deck.position.y + dt * 1.15);
      else if (deck.position.y > want) deck.position.y = Math.max(want, deck.position.y - dt * 1.25);
      const pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(time * 1.4);
      archGlow.material.opacity = functional ? 0.16 + pulse * 0.08 : 0.05;
      deckRing.material.emissiveIntensity = functional ? 0.7 + pulse * 0.4 : 0.35;
      for (const [i, mote] of motes.entries()) {
        mote.position.y = mote.userData.baseY + (calm ? 0 : Math.sin(time * 0.9 + i) * 0.18);
      }
      crystal.rotation.y += calm ? 0 : dt * 0.35;
    },
  };
}

/**
 * The Great Shell: two valves around a tidepool nook, three pebbles on one rock
 * and two on another. A child reads the two groups, adds them and zaps the
 * total; the shells creak open.
 */
function buildShellGate(island, def, accent, palette) {
  const root = new THREE.Group();
  const origin = island.zone.origin;
  const cluster = new THREE.Group();
  cluster.position.set(def.at.x, island.heightAtLocal(def.at.x, def.at.z), def.at.z);
  cluster.rotation.y = Math.atan2(def.faceTo.x - def.at.x, def.faceTo.z - def.at.z);
  root.add(cluster);

  // Coral doorposts and a driftwood lintel.
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4.2, 6), mat(0xffb3c9, { rough: 0.7 }));
    post.position.set(side * 2.7, 2.1, 0);
    post.rotation.z = side * 0.06;
    cluster.add(post);
    for (let b = 0; b < 3; b++) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.1, 5), mat(b % 2 ? 0xff9ec4 : 0xffd0c0));
      arm.position.set(side * 2.7 + (b - 1) * 0.28, 2.9 + b * 0.4, 0.1);
      arm.rotation.z = side * (0.35 + b * 0.2);
      cluster.add(arm);
    }
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), mat(0x8bbfc4));
    rock.position.set(side * 2.7, 0.25, 0.2);
    rock.scale.set(1.2, 0.6, 1.2);
    cluster.add(rock);
  }
  const lintel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 6.1, 6), mat(0xc9a87c));
  lintel.position.y = 4.25;
  lintel.rotation.z = Math.PI / 2;
  cluster.add(lintel);
  for (let i = 0; i < 4; i++) {
    const shell = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), mat(0xffe3f1, { rough: 0.5 }));
    shell.position.set((i - 1.5) * 0.9, 4.0 - Math.abs(i - 1.5) * 0.08, 0.2);
    shell.rotation.x = Math.PI;
    cluster.add(shell);
  }

  // Two valves, hinged at the posts, meeting at the pearl.
  const valves = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 2.35, 0, 0);
    cluster.add(pivot);
    const valve = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), mat(0xffd0e0, { rough: 0.45 }));
    valve.scale.set(1.55, 2.0, 0.55);
    valve.position.set(-side * 1.2, 1.55, 0);
    pivot.add(valve);
    for (let r = 0; r < 3; r++) {
      const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.8 + r * 0.35, 0.05, 5, 14, Math.PI), mat(0xffb7d0, { rough: 0.5 }));
      ridge.position.set(-side * 1.2, 1.35 + r * 0.2, 0.3);
      ridge.rotation.z = side * Math.PI / 2;
      pivot.add(ridge);
    }
    valves.push({ pivot, side });
  }
  const pearl = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 10),
    mat(0xfff1c8, { emissive: 0xffd166, emissiveIntensity: 0.7, rough: 0.2 })
  );
  pearl.position.set(0, 1.95, 0.16);
  cluster.add(pearl);

  const glint = makeSprite(accent, 3.2, 0.08);
  glint.position.set(0, 2.1, 0.5);
  cluster.add(glint);

  // The two countable pebble rocks, in front and to one side.
  const pebbleGroups = [];
  // Two low plinths in the foreground, one per group, so both counts are in
  // view from the place a child naturally stands. The pebbles sit at eye level
  // for a five-year-old, above the grass and never behind a standing stone.
  const spots = [
    { x: -3.9, z: 5.0, count: def.pebbles?.[0] ?? 3, round: true },
    { x: 3.9, z: 5.0, count: def.pebbles?.[1] ?? 2, round: false },
  ];
  for (const spot of spots) {
    const rock = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 0.95, 6), mat(0x8bbfc4));
    stem.position.y = 0.48;
    rock.add(stem);
    const slab = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), mat(0x9aa8b8));
    slab.scale.set(spot.round ? 1.2 : 1.35, spot.round ? 0.6 : 0.4, 1.05);
    slab.position.y = 1.0;
    rock.add(slab);
    for (let i = 0; i < spot.count; i++) {
      const a = (i / spot.count) * Math.PI * 2 + 0.4;
      const pebble = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 10, 8),
        mat(i % 2 ? 0xfff1c8 : 0xffd9a0, { rough: 0.6, emissive: 0xffd166, emissiveIntensity: 0.12 })
      );
      pebble.position.set(Math.cos(a) * 0.5, 1.36, Math.sin(a) * 0.4);
      pebble.scale.set(1, 0.85, 1);
      rock.add(pebble);
    }
    rock.position.set(spot.x, 0, spot.z);
    cluster.add(rock);
    pebbleGroups.push(rock);
  }

  // The tidepool nook the shell was hiding.
  const pocket = buildPocketRing(island, def, 'cove', accent, mulberry32(8812));
  root.add(pocket);

  let openAmount = 0;
  let target = 0;
  let solved = false;
  const blockPlayer = (pos) => {
    if (solved || !def.pocket) return null;
    const ox = origin.x + def.pocket.x;
    const oz = origin.z + def.pocket.z;
    const dx = pos.x - ox;
    const dz = pos.z - oz;
    const d = Math.hypot(dx, dz);
    const r = def.pocket.r - 0.4;
    if (d >= r) return null;
    if (d < 0.01) {
      const gx = def.at.x - def.pocket.x;
      const gz = def.at.z - def.pocket.z;
      const gl = Math.hypot(gx, gz) || 1;
      return { x: ox + (gx / gl) * r, z: oz + (gz / gl) * r };
    }
    const scale = r / d;
    return { x: ox + dx * scale, z: oz + dz * scale };
  };

  return {
    group: root,
    glint,
    blockPlayer,
    open(animate) {
      solved = true;
      target = 1;
      if (!animate) {
        openAmount = 1;
        for (const v of valves) v.pivot.rotation.y = v.side * 1.15;
      }
    },
    update(dt, time, calm, player) {
      if (openAmount !== target) {
        openAmount = Math.min(target, openAmount + dt * 0.8);
        const ease = openAmount * openAmount * (3 - 2 * openAmount);
        for (const v of valves) v.pivot.rotation.y = v.side * 1.15 * ease;
      }
      const pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(time * 1.4);
      glint.material.opacity = target > 0 ? 0.1 + pulse * 0.05 : 0.06 + pulse * 0.05;
      glint.scale.set(target > 0 ? 4.6 : 3.2, target > 0 ? 3.6 : 2.6, 1);
      pearl.rotation.y += calm ? 0 : dt * 0.4;
    },
  };
}

export function buildPuzzleSite(island, def) {
  const palette = island.zone.palette;
  const accent = palette.accent;
  const site = new THREE.Group();
  let mechanism;
  if (def.kind === 'word') mechanism = buildVeilGate(island, def, accent);
  else if (def.kind === 'count') mechanism = buildCountCrossing(island, def, accent, palette);
  else if (def.kind === 'pattern') mechanism = buildPatternLift(island, def, accent);
  else if (def.kind === 'add') mechanism = buildShellGate(island, def, accent, palette);
  else mechanism = buildRunePath(island, def, accent);

  site.add(mechanism.group);

  const choices = [];
  for (const choice of def.choices) {
    const stone = buildChoiceStone(choice, accent);
    const y = island.heightAtLocal(choice.at.x, choice.at.z);
    stone.group.position.set(choice.at.x, y, choice.at.z);
    stone.baseY = y;
    site.add(stone.group);
    choices.push(stone);
  }

  // The approach: worn flat stones from the island's path to the puzzle, so it
  // reads as a place the path leads to and then stops at.
  const dir = new THREE.Vector3(def.at.x - def.faceTo.x, 0, def.at.z - def.faceTo.z);
  const len = dir.length() || 1;
  dir.multiplyScalar(1 / len);
  for (let i = 1; i <= 5; i++) {
    const x = def.at.x - dir.x * (4.5 + i * 1.35);
    const z = def.at.z - dir.z * (4.5 + i * 1.35);
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.09, 7), mat(0x9aa08c, { rough: 0.95 }));
    slab.position.set(x, island.heightAtLocal(x, z) + 0.05, z);
    slab.rotation.y = i * 0.7;
    site.add(slab);
  }

  let ready = false;
  let solved = false;
  return {
    def,
    group: site,
    choices,
    get solved() { return solved; },
    get ready() { return ready; },
    setReady(on) {
      ready = on;
      for (const stone of choices) {
        if (stone.state === 'sleep' || stone.state === 'active') stone.setState(on ? 'active' : 'sleep');
      }
    },
    setStateFor(id, state) {
      const stone = choices.find((c) => c.id === id);
      if (stone) stone.setState(state);
    },
    applyStep(count) {
      if (mechanism.applyStep) mechanism.applyStep(count);
    },
    blockPlayer(pos) {
      return mechanism.blockPlayer ? mechanism.blockPlayer(pos) : null;
    },
    surfaceAt(x, z) {
      return mechanism.surfaceAt ? mechanism.surfaceAt(x, z) : null;
    },
    applySolved(nextSolved, animate) {
      solved = nextSolved;
      if (nextSolved) {
        mechanism.open(animate);
        for (const stone of choices) if (stone.state !== 'correct') stone.setState('correct');
      }
    },
    update(dt, time, camera, calm, player) {
      mechanism.update(dt, time, camera, calm, player);
      for (const stone of choices) stone.update(dt, time, camera, calm);
    },
    centerWorld(out = new THREE.Vector3()) {
      return out.set(
        island.zone.origin.x + def.at.x,
        island.zone.origin.y + island.heightAtLocal(def.at.x, def.at.z) + 1.2,
        island.zone.origin.z + def.at.z
      );
    },
  };
}
