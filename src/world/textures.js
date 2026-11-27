import * as THREE from 'three';

const FONT = "'Fredoka Variable', 'Baloo 2', 'Trebuchet MS', system-ui, sans-serif";
const INK = '#26314f';
const CREAM = '#fffaf0';

let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.72)');
  g.addColorStop(0.62, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTex = new THREE.CanvasTexture(canvas);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

export function makeSprite(color, scale = 1, opacity = 1) {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(scale);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawText(ctx, text, size, fill = CREAM, stroke = INK, strokeWidth = 16, y = 128) {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = stroke;
  ctx.shadowColor = 'rgba(20,26,48,0.45)';
  ctx.shadowBlur = 14;
  ctx.strokeText(text, 128, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = fill;
  ctx.fillText(text, 128, y);
}

function drawShape(ctx, shape, color, cx = 128, cy = 128, r = 78) {
  ctx.save();
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(cx - r * 0.82, cy - r * 0.82, r * 1.64, r * 1.64);
  } else if (shape === 'triangle') {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.92, cy + r * 0.72);
    ctx.lineTo(cx - r * 0.92, cy + r * 0.72);
    ctx.closePath();
  } else if (shape === 'star') {
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 === 0 ? r : r * 0.46;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (shape === 'heart') {
    ctx.moveTo(cx, cy + r * 0.72);
    ctx.bezierCurveTo(cx - r * 1.3, cy - r * 0.1, cx - r * 0.5, cy - r * 1.05, cx, cy - r * 0.42);
    ctx.bezierCurveTo(cx + r * 0.5, cy - r * 1.05, cx + r * 1.3, cy - r * 0.1, cx, cy + r * 0.72);
    ctx.closePath();
  } else {
    ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = 14;
  ctx.strokeStyle = INK;
  ctx.shadowColor = 'rgba(20,26,48,0.4)';
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.fill();
  // glossy highlight
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.28, cy - r * 0.34, r * 0.24, r * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawDots(ctx, count, compact = false) {
  const n = Math.max(1, Math.min(12, count));
  if (compact) {
    // A quiet counting aid under a big numeral.
    const radius = 11;
    const gap = 28;
    const y = 212;
    for (let i = 0; i < n; i++) {
      const x = 128 + (i - (n - 1) / 2) * gap;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#8fd6ff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    return;
  }
  const perRow = n <= 4 ? n : n <= 8 ? 4 : 4;
  const rows = Math.ceil(n / perRow);
  const radius = n <= 6 ? 23 : 19;
  const gap = radius * 2 + 10;
  let left = n;
  for (let row = 0; row < rows; row++) {
    const inRow = Math.min(perRow, left);
    left -= inRow;
    const y = 128 + (row - (rows - 1) / 2) * gap;
    for (let i = 0; i < inRow; i++) {
      const x = 128 + (i - (inRow - 1) / 2) * gap;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#6fc3ff';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.34, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();
    }
  }
}

/** A warm round picture plate behind a group of emoji. */
function drawPlate(ctx) {
  const plate = ctx.createRadialGradient(112, 100, 12, 128, 128, 118);
  plate.addColorStop(0, '#fffdf6');
  plate.addColorStop(1, '#ffe9c4');
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.fillStyle = plate;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(38,49,79,0.55)';
  ctx.stroke();
}

function drawEmoji(ctx, text, x, y, size) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(20,26,48,0.28)';
  ctx.shadowBlur = 10;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

/**
 * A big plus or minus, drawn as a shape so it stays crisp and unambiguous at
 * distance (text dashes shrink into nothing on a sign).
 */
function drawOperator(ctx, kind, x, y, size) {
  const h = size / 2;
  const t = size * 0.23;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  if (kind === '+') {
    ctx.moveTo(-t, -h);
    ctx.lineTo(t, -h);
    ctx.lineTo(t, -t);
    ctx.lineTo(h, -t);
    ctx.lineTo(h, t);
    ctx.lineTo(t, t);
    ctx.lineTo(t, h);
    ctx.lineTo(-t, h);
    ctx.lineTo(-t, t);
    ctx.lineTo(-h, t);
    ctx.lineTo(-h, -t);
    ctx.lineTo(-t, -t);
    ctx.closePath();
  } else {
    const r = t;
    const w = h;
    ctx.moveTo(-w + r, -r);
    ctx.lineTo(w - r, -r);
    ctx.quadraticCurveTo(w, -r, w, 0);
    ctx.quadraticCurveTo(w, r, w - r, r);
    ctx.lineTo(-w + r, r);
    ctx.quadraticCurveTo(-w, r, -w, 0);
    ctx.quadraticCurveTo(-w, -r, -w + r, -r);
    ctx.closePath();
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#fff8ea';
  ctx.fillStyle = INK;
  ctx.shadowColor = 'rgba(20,26,48,0.35)';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.restore();
}

/** One horizontal line of emoji, centred on cx. */
function drawRow(ctx, emoji, count, cx, cy, size, gap) {
  const n = Math.max(1, Math.min(6, count));
  const total = n * size + (n - 1) * gap;
  for (let i = 0; i < n; i++) {
    drawEmoji(ctx, emoji, cx - total / 2 + size / 2 + i * (size + gap), cy, size);
  }
}

/** A vertical stack of emoji, centred on cy. */
function drawColumn(ctx, emoji, count, cx, cy, size, maxSize) {
  const n = Math.max(1, Math.min(5, count));
  const s = Math.min(maxSize, size * (n <= 2 ? 1 : n === 3 ? 0.82 : 0.7));
  const gap = 4;
  const total = n * s + (n - 1) * gap;
  for (let i = 0; i < n; i++) {
    drawEmoji(ctx, emoji, cx, cy - total / 2 + s / 2 + i * (s + gap), s);
  }
}

/** A tidy grid of emoji inside a box, used for counting groups. */
function drawGrid(ctx, emoji, count, box) {
  const n = Math.max(1, Math.min(9, count));
  const cols = Math.min(3, n);
  const rows = Math.ceil(n / cols);
  const cellW = box.w / cols;
  const cellH = box.h / rows;
  const size = Math.min(cellW, cellH) * 0.92;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const x = box.x + box.w / 2 + (c - (inRow - 1) / 2) * cellW;
    const y = box.y + box.h / 2 + (r - (rows - 1) / 2) * cellH;
    drawEmoji(ctx, emoji, x, y, size);
  }
}

/** Build a 256px transparent glyph canvas texture for a pad or sign. */
export function glyphTexture(spec) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);

  const kind = spec.kind || 'letter';
  if (kind === 'letter') {
    if (spec.marker) {
      // Letter plus a picture card, so a child who cannot read still knows
      // which letter is which. The letter stays the pad's key.
      drawText(ctx, spec.text, 122, CREAM, INK, 13, 74);
      ctx.beginPath();
      ctx.arc(128, 182, 64, 0, Math.PI * 2);
      ctx.fillStyle = '#fff6e2';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(38,49,79,0.55)';
      ctx.stroke();
      drawEmoji(ctx, spec.marker, 128, 185, 88);
    } else {
      drawText(ctx, spec.text, 190);
    }
  } else if (kind === 'number') {
    drawText(ctx, spec.text, 150, CREAM, INK, 15, 94);
    drawDots(ctx, Math.max(1, Math.min(9, parseInt(spec.text, 10) || 1)), true);
  } else if (kind === 'word') {
    drawText(ctx, spec.text, 74, CREAM, INK, 12);
  } else if (kind === 'dots') {
    drawDots(ctx, spec.count);
  } else if (kind === 'shape') {
    drawShape(ctx, spec.shape, spec.color || '#ffd166');
  } else if (kind === 'icon') {
    // Picture cards: a warm plate keeps every emoji readable on the dark sign.
    drawPlate(ctx);
    drawEmoji(ctx, spec.text, 128, 134, 148);
  } else if (kind === 'group') {
    // A countable group of one thing: how many ladybugs are there?
    drawPlate(ctx);
    drawGrid(ctx, spec.emoji ?? spec.text ?? '⭐', spec.count ?? 1, { x: 18, y: 26, w: 220, h: 200 });
  } else if (kind === 'sum') {
    drawPlate(ctx);
    drawColumn(ctx, spec.emoji, spec.a, 56, 128, 56, 62);
    drawOperator(ctx, '+', 128, 128, 66);
    drawColumn(ctx, spec.emoji, spec.b, 202, 128, 54, 44);
  } else if (kind === 'take') {
    drawPlate(ctx);
    const topSize = Math.min(40, 214 / Math.max(1, spec.from));
    drawRow(ctx, spec.emoji, spec.from, 128, 62, topSize, 4);
    drawOperator(ctx, '-', 62, 176, 96);
    drawRow(ctx, spec.emoji, spec.take, 162, 176, 40, 4);
  } else if (kind === 'seq') {
    // Sign for "what comes next": a few tiles and one empty slot.
    drawPlate(ctx);
    const items = spec.items ?? [];
    const slots = 3;
    const w = 58;
    const gap = 9;
    const total = slots * w + (slots - 1) * gap;
    for (let i = 0; i < slots; i++) {
      const cx = 128 - total / 2 + w / 2 + i * (w + gap);
      const top = 128 - w / 2;
      roundRect(ctx, cx - w / 2, top, w, w, 14);
      ctx.fillStyle = i < items.length ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.4)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(38,49,79,0.45)';
      ctx.stroke();
      if (i < items.length) {
        const item = items[i];
        if (item.kind === 'shape') drawShape(ctx, item.shape, item.color || '#ffd166', cx, 128, 21);
        else drawEmoji(ctx, item.text, cx, 128, 40);
      } else {
        ctx.beginPath();
        roundRect(ctx, cx - w / 2 + 3, top + 3, w - 6, w - 6, 12);
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(38,49,79,0.6)';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `700 34px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(38,49,79,0.55)';
        ctx.fillText('?', cx, 130);
      }
    }
  } else if (kind === 'mystery') {
    drawText(ctx, '?', 190, '#ffe9a8', INK, 18);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Rounded label plaque used for portal names. */
export function labelTexture(text, color = '#5b4bd6') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = 'rgba(255,250,240,0.96)';
  roundRect(ctx, 8, 20, 496, 120, 46);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = color;
  ctx.stroke();
  const size = text.length > 13 ? 44 : text.length > 10 ? 52 : 60;
  ctx.font = `600 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.fillText(text, 256, 82);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
