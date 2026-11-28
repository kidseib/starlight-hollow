import * as THREE from 'three';
import { makeSprite } from '../world/textures.js';
import { shapeOutlineTexture, createOrnamentMesh, SHAPE_STYLE } from '../world/ornaments.js';

/**
 * The Star Tree Workshop — a second reason to explore.
 *
 * Every adventure island hides one **Star shard**, a glowing crystal on a little
 * plinth that can be seen from far away and chimes when a child comes close.
 * The meadow's Star Tree has six empty hooks, each marked with a dashed outline
 * of one shape; zapping the outline that matches the shard in the child's pouch
 * hangs a real ornament on the trunk. The sixth shape, a Sky Lantern, is bought
 * from Momo with sparkles, so the market and the workshop feed each other.
 *
 * The rules live in pure functions so they can be unit tested without a browser.
 */

export const ORNAMENTS = [
  {
    id: 'star',
    shape: 'star',
    name: 'Golden Star',
    zone: 'grove',
    island: 'Letterleaf Grove',
    color: 0xffd166,
    line: 'A Star shard! It is a golden star. Carry it to the Star Tree!',
    placeLine: 'The Golden Star! It shines like a little sun.',
  },
  {
    id: 'moon',
    shape: 'moon',
    name: 'Silver Moon',
    zone: 'falls',
    island: 'Tallybrook Falls',
    color: 0xe4ebff,
    line: 'A Star shard! It is a silver moon. Carry it to the Star Tree!',
    placeLine: 'The Silver Moon! Now the tree has moonlight.',
  },
  {
    id: 'flower',
    shape: 'flower',
    name: 'Blossom',
    zone: 'peaks',
    island: 'Pattern Peaks',
    color: 0xff9ec4,
    line: 'A Star shard! It is a pink blossom. Carry it to the Star Tree!',
    placeLine: 'The Blossom! Pink petals for the Star Tree.',
  },
  {
    id: 'bell',
    shape: 'bell',
    name: 'Song Bell',
    zone: 'words',
    island: 'Storysong Glade',
    color: 0xffc45c,
    line: 'A Star shard! It is a song bell. Carry it to the Star Tree!',
    placeLine: 'The Song Bell! It rings a happy note.',
  },
  {
    id: 'shell',
    shape: 'shell',
    name: 'Sea Shell',
    zone: 'cove',
    island: 'Pebblecount Cove',
    color: 0xffd2b4,
    line: 'A Star shard! It is a sea shell. Carry it to the Star Tree!',
    placeLine: 'The Sea Shell! You can hear the sea inside it.',
  },
  {
    id: 'lantern',
    shape: 'lantern',
    name: 'Sky Lantern',
    market: true,
    price: 90,
    color: 0x8fe6d6,
    line: 'The Sky Lantern! Momo wrapped it in paper and starlight.',
    placeLine: 'The Sky Lantern! It glows like a tiny moon.',
  },
];

export const ORNAMENT_IDS = ORNAMENTS.map((item) => item.id);
export const SHARD_IDS = ORNAMENTS.filter((item) => !item.market).map((item) => item.id);
export const ORNAMENT_COUNT = ORNAMENTS.length;

export function ornamentById(id) {
  return ORNAMENTS.find((item) => item.id === id) ?? null;
}

/** Which ornaments a child is holding, and which are already on the tree. */
export function workshopStatus({ shards = [], placed = [], owned = [] } = {}) {
  const held = new Set(shards);
  for (const id of owned) {
    const item = ornamentById(id);
    if (item?.market) held.add(id);
  }
  const onTree = new Set(placed);
  return ORNAMENTS.map((item) => ({
    ...item,
    held: held.has(item.id),
    placed: onTree.has(item.id),
    state: onTree.has(item.id) ? 'placed' : held.has(item.id) ? 'ready' : 'searching',
  }));
}

/** Picking up a world shard. Idempotent and never loses anything. */
export function collectShard({ shards = [], placed = [] } = {}, id) {
  const item = ornamentById(id);
  if (!item || item.market) return { ok: false, reason: 'unknown', shards: [...shards], placed: [...placed] };
  if (shards.includes(id)) return { ok: false, reason: 'collected', item, shards: [...shards], placed: [...placed] };
  return { ok: true, item, shards: [...shards, id], placed: [...placed] };
}

/** A hook can only take the ornament the child is actually holding. */
export function canPlace({ shards = [], placed = [], owned = [] } = {}, id) {
  const status = workshopStatus({ shards, placed, owned }).find((item) => item.id === id);
  if (!status) return { ok: false, reason: 'unknown' };
  if (status.placed) return { ok: false, reason: 'placed', item: status };
  if (!status.held) return { ok: false, reason: 'missing', item: status };
  return { ok: true, item: status };
}

export function place({ shards = [], placed = [], owned = [] } = {}, id) {
  const check = canPlace({ shards, placed, owned }, id);
  if (!check.ok) return { ...check, placed: [...placed] };
  const next = [...placed, id];
  return { ok: true, item: check.item, placed: next, complete: isComplete(next) };
}

export function isComplete(placed = []) {
  return ORNAMENTS.every((item) => placed.includes(item.id));
}

/** Each island hides its shard in its own corner, so no two feel the same. */
const SHARD_BEARING = { grove: 205, falls: 330, peaks: 100, words: 250, cove: 25 };

/** Where an island hides its shard: a clear ring spot away from signs and arches. */
export function shardSpot(zone) {
  const avoid = [
    { x: 0, z: 0, r: 10 },
    { x: zone.spawn.x, z: zone.spawn.z, r: 8 },
    ...zone.portals.map((p) => ({ x: p.x, z: p.z, r: 9 })),
    ...zone.stations.map((s) => ({ x: s.x, z: s.z, r: 10 })),
  ];
  const bearing = ((SHARD_BEARING[zone.id] ?? 200) * Math.PI) / 180;
  let best = { x: 0, z: -zone.radius * 0.55 };
  let bestScore = -Infinity;
  for (let i = -7; i <= 7; i++) {
    const angle = bearing + i * 0.1;
    for (const ring of [0.5, 0.58, 0.66]) {
      const x = Math.cos(angle) * zone.radius * ring;
      const z = Math.sin(angle) * zone.radius * ring;
      let score = Infinity;
      for (const b of avoid) score = Math.min(score, Math.hypot(x - b.x, z - b.z) - b.r);
      score -= Math.abs(i) * 0.4; // prefer the intended corner, nudge only to clear a sign
      if (score > bestScore) {
        bestScore = score;
        best = { x, z };
      }
    }
  }
  return best;
}

// ------------------------------------------------------------- shard field --

const stone = (color) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.05, flatShading: true });

/**
 * The five world shards. Each one gets a beacon a five-year-old can spot from
 * the far side of the island: a glowing crystal, a column of light, a ring on
 * the ground and a soft chime when the player comes close.
 */
export class ShardField {
  constructor({ scene, islands, collected = [] } = {}) {
    this.scene = scene;
    this.shards = [];
    this.near = new Set();
    for (const item of ORNAMENTS) {
      if (item.market) continue;
      const data = islands.get(item.zone);
      if (!data) continue;
      const { zone, island } = data;
      const spot = shardSpot(zone);
      const y = island.heightAtLocal(spot.x, spot.z);
      const group = new THREE.Group();
      group.position.set(zone.origin.x + spot.x, y, zone.origin.z + spot.z);
      scene.add(group);

      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 0.34, 10), stone(0xe3d3ae));
      plinth.position.y = 0.17;
      group.add(plinth);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.12, 10), stone(0xb8a6d8));
      cap.position.y = 0.38;
      group.add(cap);

      const cradle = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.042, 6, 18),
        new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.32, metalness: 0.55, emissive: 0xffab33, emissiveIntensity: 0.5 })
      );
      cradle.rotation.x = Math.PI / 2;
      cradle.position.y = 0.5;
      group.add(cradle);

      const shard = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.26, 0),
        new THREE.MeshStandardMaterial({
          color: item.color,
          emissive: item.color,
          emissiveIntensity: 0.85,
          roughness: 0.22,
          metalness: 0.35,
          flatShading: true,
        })
      );
      shard.scale.set(1, 1.7, 1);
      shard.position.y = 0.86;
      group.add(shard);

      const glow = makeSprite(item.color, 1.5, 0.34);
      glow.position.y = 0.86;
      group.add(glow);

      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.46, 13, 12, 1, true),
        new THREE.MeshBasicMaterial({
          color: item.color,
          transparent: true,
          opacity: 0.085,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      column.position.y = 7;
      group.add(column);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.035, 6, 34),
        new THREE.MeshBasicMaterial({
          color: item.color,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      group.add(ring);

      const motes = [];
      for (let i = 0; i < 5; i++) {
        const mote = makeSprite(item.color, 0.5, 0.5);
        mote.userData.phase = (i / 5) * Math.PI * 2;
        mote.userData.radius = 0.36 + i * 0.06;
        group.add(mote);
        motes.push(mote);
      }

      const record = {
        id: item.id,
        item,
        group,
        shard,
        glow,
        column,
        ring,
        cradle,
        motes,
        zoneId: item.zone,
        collected: collected.includes(item.id),
        phase: Math.random() * Math.PI * 2,
      };
      group.visible = !record.collected;
      this.shards.push(record);
    }
    this.position = new THREE.Vector3();
  }

  /** The world position of a shard, useful for hints and tests. */
  worldPosition(id) {
    const found = this.shards.find((s) => s.id === id);
    if (!found) return null;
    return found.group.getWorldPosition(new THREE.Vector3());
  }

  collect(id) {
    const found = this.shards.find((s) => s.id === id);
    if (!found || found.collected) return null;
    found.collected = true;
    found.group.visible = false;
    return found;
  }

  setCollected(ids = []) {
    const set = new Set(ids);
    for (const shard of this.shards) {
      shard.collected = set.has(shard.id);
      shard.group.visible = !shard.collected;
    }
  }

  /**
   * @returns {{collected: object|null, near: object|null}}
   */
  update(dt, time, camPos, playerPos, currentZoneId) {
    let collected = null;
    let near = null;
    for (const shard of this.shards) {
      const alive = !shard.collected;
      if (!alive) continue;
      const distanceToCamera = shard.group.position.distanceTo(camPos);
      const visible = distanceToCamera < 170;
      if (shard.group.visible !== visible) shard.group.visible = visible;
      if (!visible) continue;

      shard.shard.rotation.y += dt * 1.3;
      shard.shard.position.y = 0.86 + Math.sin(time * 1.8 + shard.phase) * 0.07;
      shard.cradle.rotation.z += dt * 0.6;
      shard.glow.material.opacity = 0.42 + Math.sin(time * 2.2 + shard.phase) * 0.16;
      shard.column.material.opacity = 0.11 + Math.sin(time * 1.4 + shard.phase) * 0.035;
      shard.ring.scale.setScalar(1 + Math.sin(time * 1.6 + shard.phase) * 0.03);
      shard.motes.forEach((mote) => {
        const t = (time * 0.35 + mote.userData.phase) % (Math.PI * 2);
        const rise = ((time * 0.7 + mote.userData.phase * 3) % 4) / 4;
        mote.position.set(
          Math.cos(t) * mote.userData.radius,
          0.6 + rise * 2.2,
          Math.sin(t) * mote.userData.radius
        );
        mote.material.opacity = 0.55 * (1 - rise);
      });

      if (shard.zoneId !== currentZoneId) continue;

      const distanceToPlayer = shard.group.position.distanceTo(playerPos);
      if (!this.near.has(shard.id) && distanceToPlayer < 16) {
        this.near.add(shard.id);
        near = shard;
      }
      if (this.near.has(shard.id) && distanceToPlayer > 24) this.near.delete(shard.id);
      if (distanceToPlayer < 2.7) {
        collected = shard;
        break;
      }
    }
    return { collected, near };
  }
}

// ---------------------------------------------------------------- workshop --

const ORNAMENT_LAYOUT = [
  { angle: -0.85, row: 0 },
  { angle: 0, row: 0 },
  { angle: 0.85, row: 0 },
  { angle: -0.85, row: 1 },
  { angle: 0, row: 1 },
  { angle: 0.85, row: 1 },
];

// The Star Tree trunk is a tapered cylinder: wide at the roots, narrow at the
// top. Hooks sit exactly on that surface so ornaments rest on the bark instead
// of floating in the air beside it.
const ROW_Y = [3.3, 4.55];
const ORNAMENT_SCALE = 1.45;
const TRUNK_BOTTOM = 1.75;
const TRUNK_TOP = 0.9;
const TRUNK_HEIGHT = 9;
const trunkRadius = (y) => {
  const k = Math.min(Math.max(y, 0), TRUNK_HEIGHT) / TRUNK_HEIGHT;
  return TRUNK_BOTTOM + (TRUNK_TOP - TRUNK_BOTTOM) * k;
};

/**
 * Six hooks around the Star Tree trunk, hung from two gold garlands. Each hook
 * carries a dashed outline of the ornament that belongs there, so matching is a
 * picture job, not a reading job.
 */
export class Workshop {
  constructor({ tree, placed = [], owned = [], shards = [] } = {}) {
    this.tree = tree;
    this.root = new THREE.Group();
    tree.group.add(this.root);
    this.hooks = [];
    this.garlands = [];
    this.shards = new Set(shards);
    this.owned = new Set(owned);
    this.decorated = false;
    this.bloom = 0;
    this.badges = [];

    const gold = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffb03a,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.5,
    });

    // Two garlands of woven gold, one per row of ornaments.
    for (const y of ROW_Y) {
      const garland = new THREE.Mesh(new THREE.TorusGeometry(trunkRadius(y) + 0.14, 0.055, 6, 44), gold);
      garland.rotation.x = Math.PI / 2;
      garland.position.y = y;
      this.root.add(garland);
      this.garlands.push(garland);
    }

    ORNAMENTS.forEach((item, index) => {
      const spec = ORNAMENT_LAYOUT[index] ?? ORNAMENT_LAYOUT[0];
      const rowY = ROW_Y[spec.row] ?? ROW_Y[0];
      const radius = trunkRadius(rowY) + 0.26;
      const x = Math.sin(spec.angle) * radius;
      const z = Math.cos(spec.angle) * radius;
      const outward = new THREE.Vector3(x / radius, 0, z / radius);

      const holder = new THREE.Group();
      holder.position.set(x, rowY - 0.26, z);
      this.root.add(holder);

      // A short gold cord ties the hook to its garland bead.
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 5), gold);
      cord.position.y = 0.13;
      holder.add(cord);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), gold);
      bead.position.y = 0.26;
      holder.add(bead);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.085, 0.022, 6, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffe9a8,
          roughness: 0.3,
          metalness: 0.55,
          emissive: 0xffc94b,
          emissiveIntensity: 0.4,
        })
      );
      ring.rotation.y = Math.PI / 2;
      holder.add(ring);

      const placard = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: shapeOutlineTexture(item.shape),
          transparent: true,
          depthWrite: false,
        })
      );
      placard.scale.setScalar(0.62);
      placard.position.copy(outward.clone().multiplyScalar(0.1));
      placard.position.y = -0.02;
      placard.renderOrder = 4;
      holder.add(placard);

      const ornamentHolder = new THREE.Group();
      ornamentHolder.rotation.y = spec.angle * 0.25;
      holder.add(ornamentHolder);

      const hook = {
        id: item.id,
        item,
        holder,
        ring,
        placard,
        ornamentHolder,
        ornament: null,
        filled: false,
        pop: 0,
        sway: Math.random() * Math.PI * 2,
        worldPosition: new THREE.Vector3(),
      };
      holder.userData.hook = hook;
      this.hooks.push(hook);
    });

    this.setPlaced(placed);
    this.refreshWorldPositions();
  }

  refreshWorldPositions() {
    this.root.updateWorldMatrix(true, true);
    for (const hook of this.hooks) hook.holder.getWorldPosition(hook.worldPosition);
  }

  setState({ shards = [...this.shards], owned = [...this.owned] } = {}) {
    this.shards = new Set(shards);
    this.owned = new Set(owned);
  }

  has(ornamentId) {
    const item = ornamentById(ornamentId);
    if (!item) return false;
    return item.market ? this.owned.has(ornamentId) : this.shards.has(ornamentId);
  }

  /** Hooks that can still take an ornament, nearest-camera friendly. */
  aimCandidates() {
    return this.hooks.filter((hook) => !hook.filled);
  }

  hookById(id) {
    return this.hooks.find((hook) => hook.id === id) ?? null;
  }

  /**
   * Try to hang one ornament. Returns a small result the game turns into
   * speech; never throws and never removes anything from the pouch.
   */
  tryPlace(id) {
    const hook = this.hookById(id);
    if (!hook) return { ok: false, reason: 'unknown' };
    if (hook.filled) return { ok: false, reason: 'placed', item: hook.item, hook };
    if (!this.has(id)) return { ok: false, reason: 'missing', item: hook.item, hook };
    this.fill(hook, true);
    return { ok: true, item: hook.item, hook, complete: this.isComplete() };
  }

  fill(hook, animate = false) {
    if (hook.filled) return;
    hook.filled = true;
    hook.placard.visible = false;
    const ornament = createOrnamentMesh(hook.item.shape);
    ornament.scale.setScalar(animate ? 0.001 : ORNAMENT_SCALE);
    ornament.position.y = -0.46;
    hook.ornamentHolder.add(ornament);
    hook.ornament = ornament;
    hook.pop = animate ? 1 : 0;
    if (this.isComplete()) this.decorate();
  }

  setPlaced(ids = []) {
    const set = new Set(ids);
    for (const hook of this.hooks) {
      if (set.has(hook.id) && !hook.filled) this.fill(hook, false);
      if (!set.has(hook.id) && hook.filled) {
        hook.filled = false;
        hook.placard.visible = true;
        if (hook.ornament) {
          hook.ornamentHolder.remove(hook.ornament);
          hook.ornament = null;
        }
      }
    }
    if (this.isComplete()) this.decorate();
  }

  isComplete() {
    return this.hooks.every((hook) => hook.filled);
  }

  placedIds() {
    return this.hooks.filter((hook) => hook.filled).map((hook) => hook.id);
  }

  /** The payoff: the trunk glows, the leaves turn gold-green, stars gather. */
  decorate() {
    if (this.decorated) return;
    this.decorated = true;
    const leaf = new THREE.Color(0x7be0a8);
    const gold = new THREE.Color(0xffd166);
    this.tree.canopy.children.forEach((blob) => {
      blob.material = blob.material.clone();
      blob.material.color.copy(leaf).lerp(gold, 0.16);
      blob.material.emissive.setHex(0xa8ffc8);
      blob.material.emissiveIntensity = 0.22;
    });
    const palette = ORNAMENTS.map((item) => new THREE.Color(item.color));
    for (let i = 0; i < 16; i++) {
      const glow = makeSprite(palette[i % palette.length].getHex(), 1.9, 0.42);
      const a = (i / 16) * Math.PI * 2;
      glow.position.set(Math.cos(a) * 3.9, 8.0 + Math.sin(i * 1.7) * 2.6, Math.sin(a) * 3.9);
      this.root.parent.add(glow);
      this.badges.push(glow);
    }
    const crown = makeSprite(0xfff2b0, 7.5, 0.28);
    crown.position.y = 13.2;
    this.root.parent.add(crown);
    this.crownGlow = crown;
    this.bloom = 0;
  }

  update(dt, time, camPos) {
    const near = camPos.distanceTo(this.root.getWorldPosition(new THREE.Vector3())) < 90;
    for (const hook of this.hooks) {
      if (hook.pop > 0) {
        hook.pop = Math.max(0, hook.pop - dt * 1.6);
        const t = 1 - hook.pop;
        const overshoot = 1 + Math.sin(t * Math.PI) * 0.35;
        hook.ornament?.scale.setScalar(ORNAMENT_SCALE * t * overshoot);
      }
      if (hook.ornament) {
        hook.sway += dt;
        hook.ornament.rotation.z = Math.sin(hook.sway * 1.3) * 0.12 + Math.sin(time * 0.9 + hook.sway) * 0.04;
        hook.ornament.position.y = -0.46 + Math.sin(time * 1.1 + hook.sway) * 0.02;
      }
      if (hook.placard.visible) {
        hook.placard.position.y = Math.sin(time * 1.3 + hook.sway) * 0.05;
        const pulse = 0.7 + Math.sin(time * 2.4 + hook.sway) * 0.12 + (near ? 0.06 : 0);
        hook.placard.scale.setScalar(pulse);
      }
      hook.ring.material.emissiveIntensity = hook.filled ? 1.1 : 0.3 + Math.sin(time * 2 + hook.sway) * 0.16;
    }

    if (this.decorated) {
      this.bloom = Math.min(1, this.bloom + dt * 0.6);
      if (this.crownGlow) this.crownGlow.material.opacity = 0.22 + Math.sin(time * 1.6) * 0.07;
      for (let i = 0; i < this.badges.length; i++) {
        const glow = this.badges[i];
        glow.material.opacity = (0.3 + Math.sin(time * 2 + i) * 0.12) * this.bloom;
      }
    }
  }
}

export { SHAPE_STYLE };
