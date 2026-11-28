import * as THREE from 'three';
import { makeSprite } from './textures.js';
import {
  SECRETS,
  WORLD_IDS,
  sanitizeSecrets,
  secretById,
  firstFoundInWorld,
} from '../game/secrets.js';

const solid = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.62,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    flatShading: opts.flatShading ?? false,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });

/**
 * The little object a find turns into. Each silhouette is deliberately
 * different at a glance — an egg, a lantern, a chime, a book, a mushroom — so a
 * child can name what they collected without reading anything.
 */
export function trophyMesh(kind, color = 0xffd166) {
  const group = new THREE.Group();
  const glowColor = new THREE.Color(color).getHex();

  if (kind === 'egg') {
    const egg = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 14, 12),
      solid(0xfff8e6, { roughness: 0.45, emissive: glowColor, emissiveIntensity: 0.28 })
    );
    egg.scale.set(0.86, 1.12, 0.86);
    egg.position.y = 0.19;
    group.add(egg);
    for (const [x, y, z] of [[0.06, 0.24, 0.1], [-0.07, 0.15, 0.11], [0.02, 0.31, -0.09]]) {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), solid(glowColor, { roughness: 0.5 }));
      spot.scale.set(1, 1, 0.35);
      spot.position.set(x, y, z);
      group.add(spot);
    }
  } else if (kind === 'lantern') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.05, 10), solid(0xa9744f, { roughness: 0.7 }));
    group.add(base);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 10),
      solid(0xfff2b0, { emissive: glowColor, emissiveIntensity: 1.15, roughness: 0.3, transparent: true, opacity: 0.95 })
    );
    core.position.y = 0.19;
    group.add(core);
    for (let i = 0; i < 4; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.24, 0.018), solid(0xc98a3a, { metalness: 0.4, roughness: 0.4 }));
      const angle = (i / 4) * Math.PI * 2;
      rib.position.set(Math.cos(angle) * 0.1, 0.19, Math.sin(angle) * 0.1);
      group.add(rib);
    }
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.1, 8), solid(0xffc94b, { metalness: 0.45, roughness: 0.3 }));
    cap.position.y = 0.34;
    group.add(cap);
    const halo = makeSprite(glowColor, 0.9, 0.35);
    halo.position.y = 0.2;
    group.add(halo);
  } else if (kind === 'chime') {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 6, 16), solid(0xd9cbb0, { roughness: 0.5 }));
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = 0.34;
    group.add(hoop);
    for (let i = 0; i < 3; i++) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.032, 0.2 - i * 0.03, 8),
        solid(0xbfeaf5, { roughness: 0.35, metalness: 0.3, emissive: glowColor, emissiveIntensity: 0.35 })
      );
      const angle = (i / 3) * Math.PI * 2;
      pipe.position.set(Math.cos(angle) * 0.09, 0.22 - i * 0.015, Math.sin(angle) * 0.09);
      group.add(pipe);
    }
  } else if (kind === 'book') {
    const cover = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.06, 0.22),
      solid(0x6fae7a, { roughness: 0.62, emissive: glowColor, emissiveIntensity: 0.16 })
    );
    cover.position.y = 0.1;
    group.add(cover);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.19), solid(0xfff8e6, { roughness: 0.8 }));
    pages.position.y = 0.135;
    group.add(pages);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.22), solid(0x4f8a5c, { roughness: 0.6 }));
    spine.position.set(-0.145, 0.1, 0);
    group.add(spine);
  } else if (kind === 'stone') {
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), solid(0x9fc6d8, { roughness: 0.35, emissive: glowColor, emissiveIntensity: 0.18 }));
    pebble.scale.set(1.15, 0.42, 1);
    pebble.position.y = 0.11;
    group.add(pebble);
    for (const [r, y] of [[0.1, 0.135], [0.05, 0.15]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 5, 18), solid(0xdff3ff, { roughness: 0.4 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      group.add(ring);
    }
  } else if (kind === 'jar') {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.26, 12, 1, true),
      solid(0xbfeaf5, { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.34 })
    );
    glass.position.y = 0.15;
    group.add(glass);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 12), solid(0x8fd6ff, { roughness: 0.5 }));
    group.add(base);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.05, 10), solid(0xb5825a, { roughness: 0.8 }));
    cork.position.y = 0.3;
    group.add(cork);
    for (const [x, y, r] of [[0.02, 0.1, 0.028], [-0.04, 0.17, 0.022], [0.04, 0.22, 0.018]]) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), solid(0xffffff, { emissive: glowColor, emissiveIntensity: 0.6, roughness: 0.2, transparent: true, opacity: 0.85 }));
      bubble.position.set(x, y + 0.05, 0.01);
      group.add(bubble);
    }
  } else if (kind === 'kite') {
    const sail = new THREE.Mesh(new THREE.OctahedronGeometry(0.19, 0), solid(0xc9a8ff, { roughness: 0.55, emissive: glowColor, emissiveIntensity: 0.3 }));
    sail.scale.set(1, 1.15, 0.28);
    sail.position.y = 0.26;
    group.add(sail);
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 5), solid(0xfff2b0, { roughness: 0.6 }));
    spine.position.y = 0.26;
    group.add(spine);
    for (let i = 0; i < 3; i++) {
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.006), solid(0xff9ec4, { roughness: 0.7 }));
      ribbon.position.set(i % 2 ? 0.05 : -0.05, 0.1 - i * 0.05, 0);
      ribbon.rotation.z = i % 2 ? 0.5 : -0.5;
      group.add(ribbon);
    }
  } else if (kind === 'chart') {
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.008, 0.32), solid(0xfff8e6, { roughness: 0.85, emissive: glowColor, emissiveIntensity: 0.12 }));
    paper.rotation.x = -0.18;
    paper.position.y = 0.09;
    group.add(paper);
    for (const [x, z] of [[-0.06, -0.08], [0.05, -0.02], [-0.02, 0.07]]) {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 0), solid(glowColor, { emissive: glowColor, emissiveIntensity: 0.9, roughness: 0.3 }));
      star.position.set(x, 0.11, z);
      group.add(star);
    }
  } else if (kind === 'drum') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.18, 14), solid(0xffc46b, { roughness: 0.5, emissive: glowColor, emissiveIntensity: 0.2 }));
    body.position.y = 0.13;
    group.add(body);
    const skin = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.012, 14), solid(0xfff4dd, { roughness: 0.75 }));
    skin.position.y = 0.225;
    group.add(skin);
    for (const s of [-1, 1]) {
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.012), solid(0xb5825a, { roughness: 0.8 }));
      lace.position.set(s * 0.13, 0.13, 0);
      group.add(lace);
    }
  } else if (kind === 'feather') {
    const vane = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.34, 7), solid(0xff9ec4, { roughness: 0.55, emissive: glowColor, emissiveIntensity: 0.25 }));
    vane.scale.set(1, 1, 0.35);
    vane.position.set(0, 0.24, 0);
    vane.rotation.z = 0.28;
    group.add(vane);
    const quill = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.36, 5), solid(0xfff4dd, { roughness: 0.6 }));
    quill.position.set(-0.02, 0.2, 0);
    quill.rotation.z = 0.28;
    group.add(quill);
  } else if (kind === 'shell') {
    for (let i = 0; i < 5; i++) {
      const rib = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), solid(0xffd6b0, { roughness: 0.5, emissive: glowColor, emissiveIntensity: 0.2 }));
      const angle = -0.7 + i * 0.35;
      rib.scale.set(1, 2.4, 0.6);
      rib.position.set(Math.sin(angle) * 0.12, 0.13, Math.cos(angle) * 0.05);
      rib.rotation.z = angle;
      group.add(rib);
    }
    const hinge = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), solid(0xffbe94, { roughness: 0.6 }));
    hinge.position.y = 0.05;
    group.add(hinge);
  } else if (kind === 'spyglass') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.22, 12), solid(0x8fe8ff, { roughness: 0.4, metalness: 0.15, emissive: glowColor, emissiveIntensity: 0.25 }));
    tube.rotation.z = Math.PI / 2.6;
    tube.position.set(0, 0.17, 0);
    group.add(tube);
    const wide = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.09, 12), solid(0xffd166, { roughness: 0.35, metalness: 0.45 }));
    wide.rotation.z = Math.PI / 2.6;
    wide.position.set(0.12, 0.11, 0);
    group.add(wide);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), solid(0xdffcff, { roughness: 0.1, transparent: true, opacity: 0.8, emissive: 0xffffff, emissiveIntensity: 0.4 }));
    lens.position.set(0.15, 0.1, 0);
    group.add(lens);
  } else {
    // mushroom
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.17, 9), solid(0xfff4dd, { roughness: 0.75 }));
    stem.position.y = 0.09;
    group.add(stem);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      solid(glowColor, { roughness: 0.45, emissive: glowColor, emissiveIntensity: 0.55 })
    );
    cap.scale.set(1, 0.72, 1);
    cap.position.y = 0.18;
    group.add(cap);
    for (const [x, z] of [[0.06, 0.05], [-0.05, 0.07], [0.0, -0.08]]) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), solid(0xfffdf6, { roughness: 0.6 }));
      dot.scale.set(1, 0.4, 1);
      dot.position.set(x, 0.26, z);
      group.add(dot);
    }
    const glow = makeSprite(glowColor, 0.7, 0.25);
    glow.position.y = 0.2;
    group.add(glow);
  }

  return group;
}

/**
 * A hidden hollow in the world: a mossy stone ring with something warm sitting
 * inside it. It never says "press here" — the glow is subtle until a child is
 * close, then the little object is simply too interesting to walk past.
 */
export class SecretSpot {
  constructor({ scene, position, secret, found = false }) {
    this.scene = scene;
    this.secret = secret;
    this.found = found;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = (secret.at.x * 0.7 + secret.at.z * 0.3) % (Math.PI * 2);
    scene.add(this.group);
    this.time = 0;
    this.pop = 0;
    this._build();
  }

  _build() {
    const moss = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 18),
      solid(0x6fbf6a, { roughness: 0.9 })
    );
    moss.rotation.x = -Math.PI / 2;
    moss.position.y = 0.02;
    this.group.add(moss);

    // Six weathered stones, uneven on purpose so it reads as found, not built.
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.4;
      const radius = 0.62 + (i % 2) * 0.06;
      const stone = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.15 + (i % 3) * 0.03, 0),
        solid(i % 2 ? 0xb9b3a4 : 0xa49d8d, { roughness: 0.85, flatShading: true })
      );
      stone.position.set(Math.cos(angle) * radius, 0.11, Math.sin(angle) * radius);
      stone.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      stone.scale.set(1, 0.75, 1);
      this.group.add(stone);
    }

    // A little gold cradle frames the find so it reads against the grass.
    const cradle = new THREE.Mesh(
      new THREE.TorusGeometry(0.33, 0.035, 6, 20),
      solid(0xffd166, { metalness: 0.35, roughness: 0.42, emissive: 0xffb52e, emissiveIntensity: 0.15 })
    );
    cradle.rotation.x = Math.PI / 2;
    cradle.position.y = 0.05;
    this.group.add(cradle);

    this.item = trophyMesh(this.secret.trophy, this.secret.color);
    this.item.scale.setScalar(1.12);
    this.item.position.y = 0.06;
    this.group.add(this.item);
    this.item.visible = !this.found;

    // A gentle warmth that only wakes up when someone is near.
    this.glow = makeSprite(this.secret.color, 1.7, this.found ? 0.12 : 0.3);
    this.glow.position.y = 0.3;
    this.group.add(this.glow);

    // Found hollows keep a tiny star so the place still reads as "you were here".
    this.mark = makeSprite(0xfff2b0, 0.7, 0);
    this.mark.position.y = 0.35;
    this.group.add(this.mark);
    if (this.found) this.mark.material.opacity = 0.55;
  }

  /** Distance for the "close enough" test; the spot itself is generous. */
  distanceTo(pos) {
    return Math.hypot(pos.x - this.group.position.x, pos.z - this.group.position.z);
  }

  /** Play the find: the object rises, turns and sparkles, then settles. */
  take() {
    if (this.found) return false;
    this.found = true;
    this.pop = 1;
    return true;
  }

  /** Called when the save says this one was already found in another session. */
  setFound(found) {
    this.found = !!found;
    this.item.visible = !this.found;
    this.mark.material.opacity = this.found ? 0.55 : 0;
    this.glow.material.opacity = this.found ? 0.12 : 0.3;
  }

  update(dt, time, cameraPos) {
    this.time += dt;
    const near = this.distanceTo(cameraPos);
    const awake = this.found ? 0.1 : (near < 12 ? 0.34 : 0.16);
    this.glow.material.opacity = awake + Math.sin(time * 1.8 + this.group.position.x) * 0.06;
    this.glow.scale.setScalar(1.7 + Math.sin(time * 1.5) * 0.12);

    if (this.pop > 0) {
      this.pop = Math.max(0, this.pop - dt * 1.4);
      const lift = Math.sin(this.pop * Math.PI) * 0.5;
      this.item.position.y = 0.06 + lift;
      this.item.rotation.y += dt * 6;
      this.item.scale.setScalar(1 + Math.sin(this.pop * Math.PI) * 0.35);
      if (this.pop === 0) {
        this.item.visible = false;
        this.mark.material.opacity = 0.55;
      }
    } else if (!this.found) {
      this.item.position.y = 0.06 + Math.sin(time * 1.7 + this.group.position.z) * 0.03;
      this.item.rotation.y += dt * 0.4;
    }
  }
}

/**
 * The Discovery Shelf in the meadow: five shallow dishes on a mossy plinth.
 * Everything found appears here, and stays there, so the hub visibly fills up
 * as a child explores. It is also the only place the collection is shown in the
 * world, which makes walking back to the meadow worth doing.
 */
/**
 * The Discovery Shelf in the meadow: one dish per island, each with a row of
 * little pips — one per secret that island hides. A non-reading child reads the
 * whole collection by looking: which dishes are empty, which pips are lit, and
 * whether the gold rim sparkles because every pip is lit.
 */
export class DiscoveryShelf {
  constructor({ scene, position, yaw = 0, found = [] }) {
    this.scene = scene;
    this.found = new Set(found);
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = yaw;
    scene.add(this.group);
    this.trophies = new Map();
    this.pips = [];
    this._build();
    this.refresh(found);
  }

  _build() {
    const stone = solid(0xe3d3ae, { roughness: 0.85, flatShading: true });
    const stoneDark = solid(0xc9b894, { roughness: 0.88, flatShading: true });
    const wood = solid(0xb5825a, { roughness: 0.72 });
    const gold = solid(0xffd166, { metalness: 0.4, roughness: 0.35 });

    // A low stepped stand: three keepsakes in front, three one step back, so a
    // child can see every island's find at once without the stand walling off
    // the meadow behind it.
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.48, 0.15, 18), stoneDark);
    foot.position.y = 0.08;
    this.group.add(foot);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.44, 18), stone);
    body.position.y = 0.37;
    this.group.add(body);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.2, 0.09, 18), wood);
    cap.position.y = 0.64;
    this.group.add(cap);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.23, 0.04, 6, 26), gold);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.7;
    this.group.add(rim);
    const moss = new THREE.Mesh(new THREE.CircleGeometry(1.15, 20), solid(0x7fd47a, { roughness: 0.95 }));
    moss.rotation.x = -Math.PI / 2;
    moss.position.y = 0.695;
    this.group.add(moss);

    // The raised back step.
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.0, 0.26, 16), stoneDark);
    step.position.set(0, 0.78, -0.26);
    step.scale.set(1, 1, 0.72);
    this.group.add(step);
    const stepTop = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.86, 0.07, 16), wood);
    stepTop.position.set(0, 0.92, -0.26);
    stepTop.scale.set(1, 1, 0.72);
    this.group.add(stepTop);

    this.worlds = WORLD_IDS.filter((zone) => SECRETS.some((s) => s.zone === zone));
    this.worldDish = new Map();
    this.worlds.forEach((zone, i) => {
      // Front row left, centre, right; back row in the gaps between them.
      const back = i % 2 === 1;
      const slot = Math.floor(i / 2);
      const spread = back ? [-0.58, 0.58, 0][slot] : [-0.96, 0, 0.96][slot];
      const x = spread;
      const y = back ? 0.96 : 0.7;
      const z = back ? -0.4 : 0.16;
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.05, 12), wood);
      dish.position.set(x, y + 0.03, z);
      this.group.add(dish);
      this.worldDish.set(zone, new THREE.Vector3(x, y + 0.01, z));

      // A row of gems on the stand in front of each dish: one per secret here.
      const secrets = SECRETS.filter((s) => s.zone === zone);
      secrets.forEach((secret, j) => {
        const gemSpread = (j - (secrets.length - 1) / 2) * 0.1;
        const pip = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), solid(0xbfc6d4, { roughness: 0.55 }));
        pip.position.set(x + gemSpread, back ? 0.72 : 0.58, back ? -0.04 : 0.46);
        this.group.add(pip);
        this.pips.push({ id: secret.id, mesh: pip, color: secret.color });
      });
    });

    this.halo = makeSprite(0xfff2b0, 2.6, 0.05);
    this.halo.position.set(0, 1.35, -0.2);
    this.group.add(this.halo);
  }

  /** Show the keepsake and pips the save says were found. Idempotent. */
  refresh(found = []) {
    this.found = new Set(sanitizeSecrets(found));
    for (const pip of this.pips) {
      const lit = this.found.has(pip.id);
      pip.mesh.material.color.set(lit ? pip.color : 0xbfc6d4);
      pip.mesh.material.emissive.set(lit ? pip.color : 0x000000);
      pip.mesh.material.emissiveIntensity = lit ? 0.95 : 0;
      pip.mesh.scale.setScalar(lit ? 1.5 : 1);
    }
    for (const [id, mesh] of this.trophies) {
      if (this.found.has(id)) continue;
      this.group.remove(mesh);
      this.trophies.delete(id);
    }
    for (const zone of this.worlds) {
      const first = firstFoundInWorld([...this.found], zone);
      const dish = this.worldDish.get(zone);
      if (!dish) continue;
      // Only the island's first find stands on the dish; the gems carry the rest.
      for (const [id, mesh] of this.trophies) {
        if (secretById(id)?.zone === zone && id !== first?.id) { this.group.remove(mesh); this.trophies.delete(id); }
      }
      if (!first || this.trophies.has(first.id)) continue;
      const mesh = trophyMesh(first.trophy, first.color);
      mesh.position.copy(dish);
      mesh.rotation.y = 0.25;
      mesh.scale.setScalar(0.001);
      this.group.add(mesh);
      this.trophies.set(first.id, mesh);
    }
  }

  update(dt, time) {
    this.halo.material.opacity = 0.04 + this.found.size * 0.01 + Math.sin(time * 1.3) * 0.02;
    for (const [id, mesh] of this.trophies) {
      mesh.scale.setScalar(Math.min(1.12, mesh.scale.x + dt * 2.6));
      const dish = this.worldDish.get(secretById(id)?.zone);
      if (dish) {
        mesh.position.y = dish.y + Math.sin(time * 1.4 + dish.x) * 0.012;
        mesh.rotation.y = 0.25 + Math.sin(time * 0.9 + dish.x) * 0.2;
      }
    }
  }
}

/**
 * An island's own keepsake cairn: two dishes beside the way home. Whatever was
 * found on this island stands here, so coming back to a world shows what you did
 * there instead of only telling the meadow about it.
 */
export class KeepsakeCairn {
  constructor({ scene, position, yaw = 0, zone, found = [] }) {
    this.scene = scene;
    this.zone = zone;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = yaw;
    scene.add(this.group);
    this.trophies = new Map();
    this.pips = [];
    this._build();
    this.refresh(found);
  }

  _build() {
    const stone = solid(0xdcc9a6, { roughness: 0.86, flatShading: true });
    const stoneDark = solid(0xc2ad8b, { roughness: 0.9, flatShading: true });
    const wood = solid(0xb5825a, { roughness: 0.74 });

    for (let i = 0; i < 3; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 - i * 0.09, 0), i % 2 ? stone : stoneDark);
      rock.position.set(0, 0.24 + i * 0.3, 0);
      rock.rotation.set(i * 0.6, i * 1.1, i * 0.3);
      rock.scale.set(1, 0.8, 1);
      this.group.add(rock);
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.46, 0.1, 12), wood);
    cap.position.y = 1.06;
    this.group.add(cap);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.03, 6, 20), solid(0xffd166, { metalness: 0.4, roughness: 0.4 }));
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 1.11;
    this.group.add(trim);

    const secrets = SECRETS.filter((s) => s.zone === this.zone);
    this.dishes = secrets.map((secret, i) => {
      const spread = (i - (secrets.length - 1) / 2) * 0.42;
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.05, 10), wood);
      dish.position.set(spread, 1.13, 0.1);
      this.group.add(dish);
      const pip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), solid(0xbfc6d4, { roughness: 0.6 }));
      pip.position.set(spread, 1.14, 0.42);
      this.group.add(pip);
      this.pips.push({ id: secret.id, mesh: pip, color: secret.color });
      return { secret, position: dish.position.clone() };
    });
  }

  refresh(found = []) {
    const list = sanitizeSecrets(found);
    for (const pip of this.pips) {
      const lit = list.includes(pip.id);
      pip.mesh.material.color.set(lit ? pip.color : 0xbfc6d4);
      pip.mesh.material.emissive.set(lit ? pip.color : 0x000000);
      pip.mesh.material.emissiveIntensity = lit ? 0.85 : 0;
      pip.mesh.scale.setScalar(lit ? 1.4 : 1);
    }
    for (const slot of this.dishes) {
      const has = list.includes(slot.secret.id);
      const existing = this.trophies.get(slot.secret.id);
      if (has && !existing) {
        const mesh = trophyMesh(slot.secret.trophy, slot.secret.color);
        mesh.position.copy(slot.position);
        mesh.scale.setScalar(0.001);
        this.group.add(mesh);
        this.trophies.set(slot.secret.id, mesh);
      } else if (!has && existing) {
        this.group.remove(existing);
        this.trophies.delete(slot.secret.id);
      }
    }
  }

  update(dt, time) {
    for (const [id, mesh] of this.trophies) {
      mesh.scale.setScalar(Math.min(0.85, mesh.scale.x + dt * 1.6));
      const slot = this.dishes.find((s) => s.secret.id === id);
      if (slot) mesh.position.y = slot.position.y + Math.sin(time * 1.5 + slot.position.x) * 0.008;
    }
  }
}
