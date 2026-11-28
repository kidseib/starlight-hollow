import * as THREE from 'three';
import { makeSprite } from './textures.js';
import { SECRETS, SECRET_IDS } from '../game/secrets.js';

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
export class DiscoveryShelf {
  constructor({ scene, position, yaw = 0, found = [] }) {
    this.scene = scene;
    this.found = new Set(found);
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = yaw;
    scene.add(this.group);
    this.trophies = new Map();
    this.pop = 0;
    this._build();
    this.refresh(found);
  }

  _build() {
    const stone = solid(0xe3d3ae, { roughness: 0.85, flatShading: true });
    const stoneDark = solid(0xc9b894, { roughness: 0.88, flatShading: true });
    const wood = solid(0xb5825a, { roughness: 0.72 });

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.22, 14), stoneDark);
    foot.position.y = 0.11;
    this.group.add(foot);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.44, 0.62, 14), stone);
    body.position.y = 0.52;
    this.group.add(body);

    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.46, 1.4, 0.12, 14), wood);
    top.position.y = 0.89;
    this.group.add(top);

    const trim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.04, 6, 26), solid(0xffd166, { metalness: 0.4, roughness: 0.35 }));
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0.95;
    this.group.add(trim);

    const mossRing = new THREE.Mesh(new THREE.CircleGeometry(1.3, 20), solid(0x7fd47a, { roughness: 0.95 }));
    mossRing.rotation.x = -Math.PI / 2;
    mossRing.position.y = 0.955;
    this.group.add(mossRing);

    // Five dishes, evenly spaced and slightly uneven, in a hand-made arc.
    const total = 5;
    this.dishes = [];
    for (let i = 0; i < total; i++) {
      const angle = -Math.PI * 0.72 + (i / (total - 1)) * Math.PI * 1.44;
      const radius = 0.86;
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.07, 12), wood);
      dish.position.set(Math.sin(angle) * radius, 0.99, Math.cos(angle) * radius);
      this.group.add(dish);
      this.dishes.push(dish.position.clone());
    }

    this.halo = makeSprite(0xfff2b0, 2.6, 0.08);
    this.halo.position.y = 1.2;
    this.group.add(this.halo);
  }

  /** Show exactly the trophies the save says were found. Idempotent. */
  refresh(found = []) {
    this.found = new Set(found);
    const list = [...this.found];
    for (const [id, mesh] of this.trophies) {
      if (!this.found.has(id)) {
        this.group.remove(mesh);
        this.trophies.delete(id);
      }
    }
    for (const id of list) {
      if (this.trophies.has(id)) continue;
      const index = SECRET_IDS.indexOf(id);
      const dish = this.dishes[index >= 0 ? index : 0];
      const secret = SECRETS.find((s) => s.id === id);
      if (!secret || !dish) continue;
      const mesh = trophyMesh(secret.trophy, secret.color);
      mesh.position.copy(dish);
      mesh.scale.setScalar(0.001);
      mesh.userData.target = 0.95;
      this.group.add(mesh);
      this.trophies.set(id, mesh);
      this.pop = 1;
    }
  }

  update(dt, time) {
    this.halo.material.opacity = 0.06 + this.found.size * 0.02 + Math.sin(time * 1.3) * 0.02;
    this.pop = Math.max(0, this.pop - dt * 1.2);
    let i = 0;
    for (const mesh of this.trophies.values()) {
      const target = mesh.userData.target ?? 0.95;
      const scale = Math.min(target, mesh.scale.x + dt * 1.6);
      mesh.scale.setScalar(scale);
      mesh.position.y = (this.dishes[i]?.y ?? 0.99) + Math.sin(time * 1.4 + i) * 0.012;
      i += 1;
    }
  }
}
