import * as THREE from 'three';
import { makeSprite } from './textures.js';

/**
 * The six shapes a child meets at the Star Tree. One painter draws them for the
 * screen (HUD pouch, market cards) and one builder makes the little 3D ornament
 * that hangs on the trunk, so a shard, a placard and the finished ornament all
 * read as the same object.
 */
export const SHAPE_STYLE = {
  star: { fill: '#ffd166', edge: '#c98a10', shine: '#fff6cf' },
  moon: { fill: '#e4ebff', edge: '#8ea2d6', shine: '#ffffff' },
  flower: { fill: '#ff9ec4', edge: '#d94f86', shine: '#ffe4ef' },
  bell: { fill: '#ffc45c', edge: '#bd7c0c', shine: '#fff2c9' },
  shell: { fill: '#ffd2b4', edge: '#cf8a60', shine: '#fff1e4' },
  lantern: { fill: '#8fe6d6', edge: '#2b9683', shine: '#e8fffa' },
  // Market gifts reuse the same painter so no card is left with an emoji.
  magnet: { fill: '#ff8a8a', edge: '#b83b4b', shine: '#ffe0e0' },
  rainbow: { fill: '#a9e0ff', edge: '#3f80c8', shine: '#f0fbff' },
};

function traceShape(ctx, shape) {
  ctx.beginPath();
  if (shape === 'star') {
    const cx = 64;
    const cy = 66;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 46 : 20;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (shape === 'moon') {
    // Crescent: a big arc out, a smaller arc back, so it reads at 20 px.
    ctx.arc(64, 64, 44, Math.PI * 0.32, Math.PI * 1.68, false);
    ctx.arc(84, 54, 36, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.closePath();
  } else if (shape === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const x = 64 + Math.cos(a) * 26;
      const y = 64 + Math.sin(a) * 26;
      ctx.moveTo(x + 18, y);
      ctx.arc(x, y, 18, 0, Math.PI * 2);
    }
    ctx.moveTo(64 + 16, 64);
    ctx.arc(64, 64, 16, 0, Math.PI * 2);
  } else if (shape === 'bell') {
    ctx.moveTo(64, 16);
    ctx.bezierCurveTo(92, 22, 94, 58, 100, 84);
    ctx.lineTo(28, 84);
    ctx.bezierCurveTo(34, 58, 36, 22, 64, 16);
    ctx.closePath();
    ctx.moveTo(64 + 12, 96);
    ctx.arc(64, 96, 12, 0, Math.PI * 2);
  } else if (shape === 'shell') {
    ctx.arc(64, 96, 50, Math.PI, 0, false);
    ctx.quadraticCurveTo(64, 74, 14, 96);
    ctx.closePath();
  } else if (shape === 'lantern') {
    // A small paper lamp with a cap, a body and a hanging cord.
    ctx.rect(38, 46, 52, 52);
    ctx.moveTo(34, 44);
    ctx.lineTo(94, 44);
    ctx.lineTo(88, 34);
    ctx.lineTo(40, 34);
    ctx.closePath();
  } else if (shape === 'magnet') {
    // A horseshoe magnet: two silver-tipped legs and a fat red bend.
    ctx.arc(64, 68, 40, Math.PI, 0, false);
    ctx.lineTo(104, 98);
    ctx.lineTo(84, 98);
    ctx.lineTo(84, 72);
    ctx.arc(64, 68, 20, 0, Math.PI, true);
    ctx.lineTo(44, 98);
    ctx.lineTo(24, 98);
    ctx.closePath();
  } else {
    // Rainbow: one fat arch, banded in paintShape.
    ctx.arc(64, 88, 52, Math.PI, 0, false);
    ctx.arc(64, 88, 30, 0, Math.PI, true);
    ctx.closePath();
  }
}

/** Draw one shape into a canvas at `size` px, cream-plate optional. */
export function paintShape(ctx, shape, size = 128, opts = {}) {
  const style = SHAPE_STYLE[shape] ?? SHAPE_STYLE.star;
  const k = size / 128;
  ctx.save();
  ctx.scale(k, k);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (opts.plate) {
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 250, 240, 0.95)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = opts.plateColor ?? '#ffd166';
    ctx.stroke();
  }

  traceShape(ctx, shape);
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = style.edge;
  ctx.stroke();

  // A soft highlight so the icon has the same rounded shine as the 3D version.
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(50, 52, 14, 9, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = style.shine;
  ctx.fill();
  ctx.globalAlpha = 1;

  if (shape === 'bell') {
    ctx.beginPath();
    ctx.moveTo(34, 74);
    ctx.lineTo(94, 74);
    ctx.lineWidth = 4;
    ctx.strokeStyle = style.edge;
    ctx.stroke();
  }
  if (shape === 'lantern') {
    ctx.beginPath();
    ctx.moveTo(64, 34);
    ctx.lineTo(64, 20);
    ctx.lineWidth = 5;
    ctx.strokeStyle = style.edge;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(64, 72, 12, 0, Math.PI * 2);
    ctx.fillStyle = style.shine;
    ctx.fill();
  }
  if (shape === 'magnet') {
    ctx.fillStyle = '#d9dee8';
    ctx.strokeStyle = '#8d97ab';
    ctx.lineWidth = 5;
    for (const x of [24, 84]) {
      ctx.beginPath();
      ctx.rect(x, 78, 20, 20);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (shape === 'rainbow') {
    const bands = ['#ff8a8a', '#ffd166', '#7bd6a0'];
    bands.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(64, 88, 46 - i * 11, Math.PI, 0, false);
      ctx.lineWidth = 9;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.95;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }
  if (shape === 'shell') {
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(64, 92);
      ctx.lineTo(64 + i * 22, 52 + Math.abs(i) * 4);
      ctx.lineWidth = 3;
      ctx.strokeStyle = style.edge;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

/** A data URL for the HUD pouch and market cards (no emoji anywhere). */
export function shapeDataUrl(shape, { size = 128, plate = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  paintShape(ctx, shape, size, { plate });
  return canvas.toDataURL('image/png');
}

/** Dashed silhouette shown on the tree where an ornament is still missing. */
export function shapeOutlineTexture(shape) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const style = SHAPE_STYLE[shape] ?? SHAPE_STYLE.star;

  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 250, 232, 0.1)';
  ctx.fill();
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(255, 246, 214, 0.75)';
  ctx.stroke();

  ctx.translate(64, 64);
  ctx.scale(1, 1);
  ctx.translate(-64 + 64, -64 + 64);
  ctx.save();
  ctx.translate(-8, -8);
  ctx.scale(1.12, 1.12);
  traceShape(ctx, shape);
  ctx.setLineDash([]);
  ctx.lineWidth = 8;
  ctx.strokeStyle = style.fill;
  ctx.globalAlpha = 0.85;
  ctx.stroke();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ------------------------------------------------------------- 3D versions --

const shiny = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.32,
    metalness: opts.metalness ?? 0.45,
    emissive: opts.emissive ?? color,
    emissiveIntensity: opts.emissiveIntensity ?? 0.28,
    flatShading: opts.flatShading ?? false,
  });

/**
 * A hanging ornament, built from primitives with a clear silhouette: it has to
 * read from the meadow floor while it is 2 m above the child's head.
 */
export function createOrnamentMesh(shape) {
  const group = new THREE.Group();
  const style = SHAPE_STYLE[shape] ?? SHAPE_STYLE.star;
  const bodyColor = new THREE.Color(style.fill).getHex();
  const edgeColor = new THREE.Color(style.edge).getHex();
  const body = shiny(bodyColor);
  const edge = shiny(edgeColor, { roughness: 0.4, metalness: 0.55 });

  // Gold cord and loop, shared by every ornament.
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 5), edge);
  cord.position.y = 0.34;
  group.add(cord);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 6, 12), edge);
  loop.position.y = 0.46;
  group.add(loop);

  const parts = new THREE.Group();
  parts.position.y = 0.2;
  group.add(parts);

  if (shape === 'star') {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.26 : 0.115;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 });
    geo.center();
    const star = new THREE.Mesh(geo, body);
    parts.add(star);
  } else if (shape === 'moon') {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.075, 8, 22, Math.PI * 1.35), body);
    arc.rotation.z = 0.5;
    parts.add(arc);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), body);
    tip.position.set(Math.cos(Math.PI * 1.35 + 0.5) * 0.2, Math.sin(Math.PI * 1.35 + 0.5) * 0.2, 0);
    parts.add(tip);
  } else if (shape === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 8), body);
      petal.scale.set(1, 0.62, 0.42);
      petal.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0);
      petal.rotation.z = a;
      parts.add(petal);
    }
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), shiny(0xfff2c0, { metalness: 0.3, roughness: 0.4 }));
    heart.position.z = 0.03;
    parts.add(heart);
  } else if (shape === 'bell') {
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.185, 0.24, 12), body);
    parts.add(bell);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.028, 6, 16), edge);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.12;
    parts.add(rim);
    const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), edge);
    clapper.position.y = -0.16;
    parts.add(clapper);
  } else if (shape === 'shell') {
    const fan = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), body);
    fan.rotation.x = Math.PI;
    fan.scale.set(1, 0.55, 1);
    parts.add(fan);
    for (let i = -2; i <= 2; i++) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.2), edge);
      ridge.position.set(i * 0.055, 0.02, -0.02);
      ridge.rotation.y = i * 0.32;
      parts.add(ridge);
    }
    const hinge = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), edge);
    hinge.position.set(0, 0.08, 0);
    parts.add(hinge);
  } else {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: bodyColor, emissive: bodyColor, emissiveIntensity: 1.1, roughness: 0.3, transparent: true, opacity: 0.92 })
    );
    parts.add(glass);
    for (const y of [0.115, -0.115]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 10), edge);
      cap.position.y = y;
      parts.add(cap);
    }
    const halo = makeSprite(bodyColor, 0.9, 0.45);
    parts.add(halo);
  }

  return group;
}
