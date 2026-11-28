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

function buildWordGate(island, def, accent) {
  const root = new THREE.Group();
  const stoneMat = mat(0x8b87aa);
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
    const foot = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), mat(0x77739a));
    foot.position.set(side * 2.5, 0.2, 0);
    foot.scale.set(1.1, 0.5, 1.1);
    cluster.add(foot);
    const moss = new THREE.SphereGeometry(0.3, 8, 6);
    const tuft = new THREE.Mesh(moss, mat(0x5f9c74));
    tuft.position.set(side * 2.5, 0.55, 0.35);
    tuft.scale.set(1.2, 0.4, 1);
    cluster.add(tuft);
  }
  const lintel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 5.9, 6), stoneMat);
  lintel.position.y = 4.35;
  lintel.rotation.z = Math.PI / 2;
  cluster.add(lintel);
  const capstone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mat(0x9a96b8));
  capstone.position.y = 4.7;
  capstone.scale.set(1.8, 0.6, 1);
  cluster.add(capstone);

  const bramble = buildBramble(4.7, 3.7, accent);
  bramble.group.position.y = 0.05;
  cluster.add(bramble.group);

  // A soft glint that only appears when the child is close, so the clearing is
  // the invitation rather than any marker.
  const glint = makeSprite(accent, 3.4, 0.1);
  glint.position.set(0, 2.2, 0.6);
  cluster.add(glint);

  // Behind the gate, a small reading glade: a mossy seat, wildflowers and two
  // standing words that stay as a quiet reward.
  const glade = new THREE.Group();
  const away = new THREE.Vector3(-def.at.x, 0, -def.at.z).normalize();
  glade.position.set(def.at.x + away.x * 5.2, island.heightAtLocal(def.at.x + away.x * 5.2, def.at.z + away.z * 5.2), def.at.z + away.z * 5.2);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.32, 0.62), mat(0x8b87aa));
  seat.position.y = 0.55;
  glade.add(seat);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.55, 5), mat(0x77739a));
    leg.position.set(side * 0.72, 0.27, 0);
    glade.add(leg);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.6;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.5, 4), mat(0x4f9a6a));
    stem.position.set(Math.cos(a) * 1.8, 0.25, Math.sin(a) * 1.6);
    glade.add(stem);
    const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), mat(0xffd8a8, { emissive: 0xffb86b, emissiveIntensity: 0.4 }));
    bloom.position.set(Math.cos(a) * 1.8, 0.52, Math.sin(a) * 1.6);
    glade.add(bloom);
  }
  root.add(glade);

  let retract = 0;
  let target = 0;
  return {
    group: root,
    glint,
    open(animate) {
      target = 1;
      if (!animate) retract = 1;
      bramble.group.visible = retract < 1;
    },
    update(dt, time, calm) {
      if (retract !== target) {
        retract = Math.min(target, retract + dt * 0.85);
        bramble.group.visible = retract < 1;
        const ease = retract * retract;
        bramble.group.scale.set(1 + ease * 0.1, Math.max(0.02, 1 - ease), 1);
        bramble.group.position.y = 0.05 - ease * 0.5;
        for (const bud of bramble.buds) bud.material.emissiveIntensity = 0.5 + ease * 1.2;
      }
      const pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(time * 1.5);
      // An opened gate keeps a soft mint shimmer in its empty frame, so the
      // change reads from a distance.
      glint.material.opacity = target > 0 ? 0.1 + pulse * 0.05 : 0.06 + pulse * 0.06;
      glint.material.color.setHex(target > 0 ? 0x8dffd0 : accent);
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
export function buildPuzzleSite(island, def) {
  const palette = island.zone.palette;
  const accent = palette.accent;
  const site = new THREE.Group();
  let mechanism;
  if (def.kind === 'word') mechanism = buildWordGate(island, def, accent);
  else if (def.kind === 'count') mechanism = buildCountCrossing(island, def, accent, palette);
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
    applySolved(nextSolved, animate) {
      solved = nextSolved;
      if (nextSolved) {
        mechanism.open(animate);
        for (const stone of choices) if (stone.state !== 'correct') stone.setState('correct');
      }
    },
    update(dt, time, camera, calm) {
      mechanism.update(dt, time, calm);
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
