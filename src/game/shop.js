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
    shape: 'magnet',
    icon: '🧲',
    name: 'Star Magnet',
    price: 40,
    blurb: 'Sparkles fly to you',
    line: 'The Star Magnet! Now sparkles will fly right to you from far away.',
  },
  {
    id: 'bell',
    shape: 'bell',
    icon: '🔔',
    name: "Pip's Bell",
    price: 70,
    blurb: 'Pip helps sooner',
    line: "Pip's Bell! Pip will show you the next sign much sooner.",
  },
  {
    id: 'lantern',
    shape: 'lantern',
    icon: '🏮',
    name: 'Sky Lantern',
    price: 90,
    blurb: 'Hangs on the Star Tree',
    line: 'The Sky Lantern! Hang it on the Star Tree with your other shapes.',
  },
  {
    id: 'rainbow',
    shape: 'rainbow',
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
