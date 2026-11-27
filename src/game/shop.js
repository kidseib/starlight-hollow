import * as THREE from 'three';
import { glyphTexture, makeSprite } from '../world/textures.js';

/**
 * Momo's Wisp Market — the first place in Starlight Hollow where sparkles buy
 * something. Prices are deliberately small enough that a child can afford the
 * first gift after finishing one island, and every gift changes what they can
 * do rather than adding a number to a menu.
 */
export const SHOP_ITEMS = [
  {
    id: 'magnet',
    icon: '🧲',
    name: 'Star Magnet',
    price: 40,
    blurb: 'Sparkles fly to you',
    line: 'The Star Magnet! Now sparkles will fly right to you from far away.',
  },
  {
    id: 'bell',
    icon: '🔔',
    name: "Pip's Bell",
    price: 70,
    blurb: 'Pip helps sooner',
    line: "Pip's Bell! Pip will show you the next sign much sooner.",
  },
  {
    id: 'rainbow',
    icon: '🌈',
    name: 'Rainbow Blaster',
    price: 110,
    blurb: 'Rainbow zaps',
    line: 'The Rainbow Blaster! Every zap you make now sparkles with colour.',
  },
];

export const SHOP_IDS = SHOP_ITEMS.map((item) => item.id);

export function itemById(id) {
  return SHOP_ITEMS.find((item) => item.id === id) ?? null;
}

/** How each card should look right now. Pure so it can be tested without a browser. */
export function shopStatus({ owned = [], sparkles = 0 } = {}) {
  const have = new Set(owned);
  return SHOP_ITEMS.map((item) => ({
    ...item,
    owned: have.has(item.id),
    affordable: sparkles >= item.price,
    status: have.has(item.id) ? 'owned' : sparkles >= item.price ? 'ready' : 'saving',
  }));
}

/**
 * Buying is all-or-nothing: the caller gets a new owned list and purse, or the
 * old ones plus a friendly reason to say out loud. Never throws for a child.
 */
export function purchase({ owned = [], sparkles = 0 } = {}, id) {
  const item = itemById(id);
  const current = new Set(owned);
  if (!item) return { ok: false, reason: 'unknown', owned: [...current], sparkles };
  if (current.has(id)) return { ok: false, reason: 'owned', item, owned: [...current], sparkles };
  if (sparkles < item.price) {
    return { ok: false, reason: 'cost', item, owned: [...current], sparkles, missing: item.price - sparkles };
  }
  current.add(id);
  return { ok: true, item, owned: [...current], sparkles: sparkles - item.price };
}

// ------------------------------------------------------------------ visuals --

/**
 * The market's own picture sign: a coral shopping bag on a warm plate. Drawn
 * here rather than borrowed from an emoji font, so it always reads the same
 * on every machine.
 */
function marketSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);

  ctx.beginPath();
  ctx.arc(128, 128, 118, 0, Math.PI * 2);
  ctx.fillStyle = '#fff4dd';
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#f4a51c';
  ctx.stroke();

  // Handle
  ctx.beginPath();
  ctx.arc(128, 112, 34, Math.PI, 0);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#a8760e';
  ctx.stroke();

  // Bag body
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  roundRect(62, 118, 132, 100, 18);
  ctx.fillStyle = '#ff7fae';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#e0508a';
  ctx.stroke();

  // Three little windows on the bag, like jars on a shelf
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(128 + i * 34, 168, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#fff4dd';
    ctx.fill();
  }

  // Sparkle badge so it reads as "treasure for sparkles"
  ctx.beginPath();
  ctx.arc(186, 96, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166';
  ctx.fill();
  ctx.fillStyle = '#a8760e';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2726', 186, 97);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Jar labels drawn as real pictures instead of emoji: a horse-shoe magnet, a
 * bell and a rainbow, each on transparent background so the jar reads cleanly.
 */
function jarIconTexture(id) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (id === 'magnet') {
    ctx.lineWidth = 26;
    ctx.strokeStyle = '#ef4457';
    ctx.beginPath();
    ctx.arc(64, 70, 34, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = '#c92f45';
    for (const x of [30, 98]) {
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x, 100);
      ctx.stroke();
    }
    ctx.strokeStyle = '#f6f2ff';
    for (const x of [30, 98]) {
      ctx.beginPath();
      ctx.moveTo(x, 88);
      ctx.lineTo(x, 100);
      ctx.stroke();
    }
  } else if (id === 'bell') {
    ctx.fillStyle = '#ffb52e';
    ctx.beginPath();
    ctx.moveTo(64, 22);
    ctx.bezierCurveTo(96, 26, 100, 62, 104, 84);
    ctx.lineTo(24, 84);
    ctx.bezierCurveTo(28, 62, 32, 26, 64, 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c97a08';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#c97a08';
    ctx.beginPath();
    ctx.arc(64, 96, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(50, 48, 8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const arcs = ['#ff6f91', '#ffa94b', '#ffe066', '#5fd6a0', '#6fb8ff', '#b189ff'];
    ctx.lineWidth = 9;
    arcs.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(64, 96, 44 - i * 8, Math.PI, 0);
      ctx.stroke();
    });
    ctx.fillStyle = '#ffffff';
    for (const [x, y, r] of [[22, 92, 9], [106, 92, 9], [20, 62, 6], [108, 62, 6]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function pictureSprite(texture, scale) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  sprite.scale.setScalar(scale);
  return sprite;
}

function solid(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    flatShading: opts.flatShading ?? false,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

/**
 * A wooden stall with a striped awning, three glass jars and Momo — a mossy
 * lantern-snail with a glowing spiral shell. Built from primitives like the
 * rest of the world, but sculpted for a clear silhouette: low body, tall
 * eyestalks, one big warm shell.
 */
export class MarketStall {
  constructor({ scene, position, yaw = 0, owned = [] }) {
    this.scene = scene;
    this.position = position.clone();
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = yaw;
    scene.add(this.group);

    this.jars = [];
    this.lanterns = [];
    this.spin = 0;
    this.hop = 0;
    this.shake = 0;
    this.blinkTimer = 2.5;
    this.blink = 0;
    this._buildStall();
    this._buildMomo();
    this.setOwned(owned);
  }

  _buildStall() {
    const wood = solid(0xb5825a, { roughness: 0.72 });
    const woodLight = solid(0xd7a97a, { roughness: 0.66 });
    const woodDark = solid(0x8d6244, { roughness: 0.75 });
    const cream = solid(0xfff6e2, { roughness: 0.6 });
    const coral = solid(0xff7fae, { roughness: 0.55 });

    // Stone footing so the stall sits on the grass instead of floating.
    const footing = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.45, 0.2, 14), solid(0xe3d3ae, { roughness: 0.85, flatShading: true }));
    footing.position.y = 0.1;
    this.group.add(footing);

    // Counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.85, 1.0), wood);
    counter.position.set(0, 0.62, 0.5);
    this.group.add(counter);
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.14, 1.2), woodLight);
    counterTop.position.set(0, 1.11, 0.5);
    this.group.add(counterTop);
    for (let i = -1; i <= 1; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.1, 0.04), woodDark);
      slat.position.set(0, 0.6 + i * 0.24, 1.02);
      this.group.add(slat);
    }

    // Warm back curtain: one soft panel with gold trim, gently self-lit so the
    // inside of the stall never turns muddy in its own shadow.
    const curtainMat = solid(0xfff1e0, { roughness: 0.8, emissive: 0xffe3c4, emissiveIntensity: 0.16 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.6, 0.12), curtainMat);
    back.position.set(0, 2.0, -1.55);
    this.group.add(back);
    for (const y of [1.28, 2.72]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.12, 0.14), solid(0xffd166, { roughness: 0.4, metalness: 0.3 }));
      trim.position.set(0, y, -1.55);
      this.group.add(trim);
    }

    // Posts
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 3.1, 8), woodLight);
        post.position.set(sx * 2.08, 1.55, sz * 0.78);
        this.group.add(post);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), solid(0xffd166, { metalness: 0.4, roughness: 0.3 }));
        cap.position.set(sx * 2.08, 3.12, sz * 0.78);
        this.group.add(cap);
      }
    }

    // Striped awning, tilted forward like a beach umbrella
    for (let i = 0; i < 6; i++) {
      // A little self-lit glow keeps the underside of the fabric readable
      // instead of turning muddy in its own shadow.
      const panelMat = i % 2
        ? solid(0xfff6e2, { roughness: 0.7, emissive: 0xffe9c4, emissiveIntensity: 0.28 })
        : solid(0xff7fae, { roughness: 0.7, emissive: 0xff5d92, emissiveIntensity: 0.26 });
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.07, 2.5), panelMat);
      panel.position.set(-1.65 + i * 0.66, 3.22, -0.05);
      panel.rotation.x = -0.24;
      this.group.add(panel);
    }
    const lip = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.14, 0.1), coral);
    lip.position.set(0, 2.93, 1.19);
    this.group.add(lip);
    for (let i = 0; i < 9; i++) {
      const scallop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), i % 2 ? cream : coral);
      scallop.position.set(-1.76 + i * 0.44, 2.85, 1.19);
      scallop.scale.set(1, 1, 0.55);
      this.group.add(scallop);
    }

    // Hanging lanterns
    for (const sx of [-1, 1]) {
      const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.34, 4), woodDark);
      hook.position.set(sx * 1.28, 2.96, 0.98);
      this.group.add(hook);
      const lantern = new THREE.Group();
      const glass = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 10, 8),
        solid(0xfff2b0, { emissive: 0xffc94b, emissiveIntensity: 1.1, roughness: 0.4, transparent: true, opacity: 0.9 })
      );
      lantern.add(glass);
      const glow = makeSprite(0xffd166, 0.9, 0.45);
      lantern.add(glow);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 5, 12), solid(0xf4a51c, { metalness: 0.5, roughness: 0.35 }));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = -0.11;
      lantern.add(rim);
      lantern.position.set(sx * 1.28, 2.66, 0.98);
      this.group.add(lantern);
      this.lanterns.push({ group: lantern, glow, phase: sx * 1.3 });
    }

    // The picture sign hangs on the front lip, exactly at a child's eye line,
    // so it is never hidden behind the awning.
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshBasicMaterial({ map: marketSignTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    sign.position.set(0, 2.42, 1.3);
    this.group.add(sign);
    this.sign = sign;
    const signGlow = makeSprite(0xffd166, 2.2, 0.14);
    signGlow.position.copy(sign.position);
    this.group.add(signGlow);
    this.signGlow = signGlow;

    // Three jars, one per gift. The icon inside each jar is the price tag a
    // pre-reader can actually use.
    const xs = [-1.05, 0, 1.05];
    SHOP_ITEMS.forEach((item, i) => {
      const jar = new THREE.Group();
      jar.position.set(xs[i], 1.18, 0.5);
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.19, 0.42, 12, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xbfeaf5,
          transparent: true,
          opacity: 0.18,
          roughness: 0.1,
          metalness: 0.2,
          side: THREE.DoubleSide,
        })
      );
      glass.position.y = 0.21;
      jar.add(glass);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 12), woodDark);
      jar.add(base);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 12), solid(0xffc94b, { metalness: 0.45, roughness: 0.3 }));
      lid.position.y = 0.45;
      jar.add(lid);
      const icon = pictureSprite(jarIconTexture(item.id), 0.3);
      icon.position.set(0, 0.24, 0.1);
      jar.add(icon);
      const sold = pictureSprite(glyphTexture({ kind: 'icon', text: '⭐' }), 0.34);
      sold.position.set(0, 0.24, 0.1);
      sold.visible = false;
      jar.add(sold);
      const jarGlow = makeSprite(0xfff2b0, 0.8, 0);
      jarGlow.position.y = 0.24;
      jar.add(jarGlow);
      this.group.add(jar);
      this.jars.push({ id: item.id, group: jar, icon, sold, glow: jarGlow, lid, phase: i * 0.7 });
    });

    // A soft ring on the ground so the stall reads as "somewhere to go".
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.035, 6, 44),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    this.group.add(ring);
    this.ring = ring;
  }

  _buildMomo() {
    // A little step raises Momo so his eyes and shell clear the counter: the
    // merchant has to be the first thing a child sees here.
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.3), solid(0x8d6244, { roughness: 0.72 }));
    step.position.set(0, 0.45, -1.0);
    this.group.add(step);
    const stepTop = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.1, 1.4), solid(0xd7a97a, { roughness: 0.66 }));
    stepTop.position.set(0, 0.94, -1.0);
    this.group.add(stepTop);

    const momo = new THREE.Group();
    // Standing on the step, Momo's face clears the counter so a child on the
    // path sees a friendly shopkeeper, not a shell behind a wall.
    this.baseY = 0.99;
    momo.position.set(0, this.baseY, -1.05);
    // Momo is the star of the stall: big enough to read his face from the path,
    // and set back far enough that his shell never hides the jars.
    this.momoScale = 1.22;
    momo.scale.setScalar(this.momoScale);
    this.group.add(momo);
    this.momo = momo;

    const bodyMat = solid(0x8fd98a, { roughness: 0.62, emissive: 0x2f7a46, emissiveIntensity: 0.16 });
    const bellyMat = solid(0xe7fbd2, { roughness: 0.66 });
    const shellMat = solid(0xffc46b, { roughness: 0.42, metalness: 0.18, emissive: 0xff9d3c, emissiveIntensity: 0.5 });
    const shellDark = solid(0xd98b3f, { roughness: 0.5, metalness: 0.15 });

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.16, 16), bellyMat);
    foot.position.y = 0.09;
    momo.add(foot);
    const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.05, 6, 20), bellyMat);
    ripple.rotation.x = Math.PI / 2;
    ripple.position.y = 0.05;
    momo.add(ripple);

    this.body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 16), bodyMat);
    this.body.scale.set(1.12, 0.78, 1.32);
    this.body.position.set(0, 0.46, 0.06);
    momo.add(this.body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), bellyMat);
    belly.scale.set(1, 0.72, 0.42);
    belly.position.set(0, 0.36, 0.55);
    momo.add(belly);

    // Glowing spiral shell: one big warm dome, two arcs to read as a spiral.
    this.shell = new THREE.Group();
    this.shell.position.set(0, 0.86, -0.3);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 14), shellMat);
    dome.scale.set(1, 0.92, 0.95);
    this.shell.add(dome);
    for (const [radius, tube, y] of [[0.32, 0.075, 0.1], [0.16, 0.06, 0.28]]) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, 22, Math.PI * 1.55), shellDark);
      arc.position.set(0.02, y - 0.16, 0.36);
      arc.rotation.z = 0.6;
      this.shell.add(arc);
    }
    const shellLight = makeSprite(0xffc46b, 1.9, 0.5);
    shellLight.position.set(0, 0, 0.1);
    this.shell.add(shellLight);
    this.shellLight = shellLight;

    // Little leaf sprout on top — silhouette charm.
    for (const s of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 5), solid(0x76dd9a, { roughness: 0.6 }));
      leaf.position.set(s * 0.07, 0.5, -0.05);
      leaf.rotation.z = s * 0.5;
      this.shell.add(leaf);
    }
    momo.add(this.shell);

    // Eyestalks with big blinking eyes
    this.eyes = [];
    for (const s of [-1, 1]) {
      const stalk = new THREE.Group();
      stalk.position.set(s * 0.2, 0.72, 0.42);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.36, 8), bodyMat);
      stem.position.y = 0.16;
      stalk.add(stem);
      const eye = new THREE.Group();
      eye.position.y = 0.38;
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), solid(0xfffdf6, { roughness: 0.35 }));
      eye.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), solid(0x2a2b45, { roughness: 0.25 }));
      pupil.position.z = 0.11;
      eye.add(pupil);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.position.set(0.04, 0.05, 0.14);
      eye.add(glint);
      stalk.add(eye);
      stalk.rotation.z = -s * 0.24;
      momo.add(stalk);
      this.eyes.push({ stalk, eye, side: s });
    }

    // Scarf and a shy smile
    const scarfMat = solid(0xff9ec4, { roughness: 0.62, emissive: 0xd94a7a, emissiveIntensity: 0.12 });
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.062, 8, 20), scarfMat);
    scarf.rotation.x = Math.PI / 2.5;
    scarf.position.set(0, 0.62, 0.3);
    momo.add(scarf);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), scarfMat);
    knot.position.set(0.22, 0.6, 0.44);
    momo.add(knot);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.08), solid(0xff9ec4, { roughness: 0.6 }));
    tail.position.set(0.3, 0.55, 0.4);
    tail.rotation.z = 0.35;
    momo.add(tail);

    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.026, 6, 14, Math.PI), solid(0x4a5878, { roughness: 0.5 }));
    smile.rotation.z = Math.PI;
    // Just proud of the belly so the smile always reads from the path.
    smile.position.set(0, 0.56, 0.8);
    momo.add(smile);
    for (const s of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), solid(0xffa8c4, { roughness: 0.7 }));
      cheek.scale.set(1, 0.7, 0.35);
      cheek.position.set(s * 0.27, 0.62, 0.72);
      momo.add(cheek);
    }

    this.momoGlow = makeSprite(0xfff2b0, 2.6, 0.12);
    this.momoGlow.position.set(0, 1.1, 0);
    momo.add(this.momoGlow);
  }

  /** Where a zap should aim to talk to Momo. */
  momoWorld() {
    return this.momo.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.0, 0));
  }

  distanceTo(position) {
    return Math.hypot(position.x - this.position.x, position.z - this.position.z);
  }

  greet() {
    this.hop = 1;
  }

  /** Momo says a friendly no: a little head shake, no sound of failure. */
  reject() {
    this.shake = 1;
  }

  setOwned(owned = []) {
    const have = new Set(owned);
    for (const jar of this.jars) {
      const done = have.has(jar.id);
      jar.icon.visible = !done;
      jar.sold.visible = done;
      jar.glow.material.opacity = done ? 0.55 : 0;
      jar.lid.material = done
        ? solid(0xfff2b0, { metalness: 0.5, roughness: 0.25, emissive: 0xffc94b, emissiveIntensity: 0.7 })
        : solid(0xffc94b, { metalness: 0.45, roughness: 0.3 });
    }
  }

  update(dt, time, cameraPos) {
    this.spin += dt;
    const near = cameraPos ? this.distanceTo(cameraPos) < 120 : true;
    if (!near) return;

    this.hop = Math.max(0, this.hop - dt * 1.6);
    this.shake = Math.max(0, this.shake - dt * 1.8);
    const pop = Math.sin(this.hop * Math.PI) * 0.14;

    this.momo.position.y = this.baseY + Math.sin(time * 1.7) * 0.02 + pop;
    const wobble = Math.sin(time * 7.5) * this.shake * 0.16;
    this.momo.rotation.z = wobble;
    this.momo.rotation.y = Math.sin(time * 0.7) * 0.1 + Math.sin(time * 2.2) * 0.02;
    const squash = 1 + Math.sin(this.hop * Math.PI) * 0.1;
    const s = this.momoScale ?? 1.22;
    this.momo.scale.set(s * squash, s * (2 - squash), s * squash);

    for (const { stalk, eye, side } of this.eyes) {
      stalk.rotation.z = -side * (0.24 + Math.sin(time * 0.9 + side) * 0.06);
      stalk.rotation.x = Math.sin(time * 1.3 + side * 0.8) * 0.05;
      eye.scale.y = this.blink > 0 ? 0.12 : 1;
    }
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blink = 0.14;
      this.blinkTimer = 2.6 + Math.random() * 3.2;
    }
    this.blink = Math.max(0, this.blink - dt);

    this.shellLight.material.opacity = 0.42 + Math.sin(time * 1.6) * 0.12 + this.hop * 0.3;
    this.momoGlow.material.opacity = 0.1 + Math.sin(time * 1.2) * 0.04 + this.hop * 0.25;

    for (const { group, glow, phase } of this.lanterns) {
      group.rotation.z = Math.sin(time * 1.1 + phase) * 0.1;
      glow.material.opacity = 0.4 + Math.sin(time * 2.4 + phase) * 0.14;
    }

    for (const jar of this.jars) {
      jar.group.position.y = 1.18 + Math.sin(time * 1.5 + jar.phase) * 0.015;
      if (jar.icon.visible) jar.icon.position.y = 0.24 + Math.sin(time * 2 + jar.phase) * 0.012;
    }

    this.signGlow.material.opacity = 0.13 + Math.sin(time * 1.4) * 0.04 + this.hop * 0.2;
    this.ring.material.opacity = 0.22 + Math.sin(time * 1.6) * 0.08;
    this.ring.scale.setScalar(1 + Math.sin(time * 1.2) * 0.015);
  }
}
