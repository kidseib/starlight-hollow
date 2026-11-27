import * as THREE from 'three';
import { glowTexture } from './textures.js';

const VERT = /* glsl */ `
  attribute float size;
  attribute float alpha;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (320.0 / max(1.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D map;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec4 tex = texture2D(map, gl_PointCoord);
    float a = tex.a * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

/** Pooled sparkle particles. All effects share a single draw call. */
export class FX {
  constructor(scene, max = 1100) {
    this.max = max;
    this.scene = scene;
    this.cursor = 0;
    this.parts = new Array(max);
    for (let i = 0; i < max; i++) {
      this.parts[i] = { alive: false, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, size: 0.5, gravity: -4, drag: 1.4, twinkle: 0 };
    }

    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: glowTexture() } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 8;
    scene.add(this.points);
    this.geo = geo;
  }

  burst(position, opts = {}) {
    const {
      color = 0xffd166,
      count = 16,
      speed = 4.5,
      spread = 0.35,
      life = 0.85,
      size = 0.6,
      gravity = -5,
      drag = 1.6,
      up = 1.6,
      twinkle = 0,
    } = opts;
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % this.max;
      const p = this.parts[idx];
      p.alive = true;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const s = speed * (0.45 + Math.random() * 0.8);
      p.vx = Math.sin(phi) * Math.cos(theta) * s;
      p.vy = Math.abs(Math.cos(phi)) * s * up * 0.6 + up;
      p.vz = Math.sin(phi) * Math.sin(theta) * s;
      p.life = life * (0.7 + Math.random() * 0.6);
      p.maxLife = p.life;
      p.size = size * (0.6 + Math.random() * 0.9);
      p.gravity = gravity;
      p.drag = drag;
      p.twinkle = twinkle;
      const jitter = (Math.random() - 0.5) * spread;
      this.pos[idx * 3] = position.x + (Math.random() - 0.5) * spread;
      this.pos[idx * 3 + 1] = position.y + (Math.random() - 0.5) * spread + jitter;
      this.pos[idx * 3 + 2] = position.z + (Math.random() - 0.5) * spread;
      this.col[idx * 3] = c.r;
      this.col[idx * 3 + 1] = c.g;
      this.col[idx * 3 + 2] = c.b;
      this.size[idx] = p.size;
      this.alpha[idx] = 1;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
    this.geo.attributes.alpha.needsUpdate = true;
  }

  /** Rising column of sparkles, used when something wonderful happens. */
  fountain(position, color = 0xfff2b0, count = 40) {
    for (let i = 0; i < count; i++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % this.max;
      const p = this.parts[idx];
      p.alive = true;
      p.vx = (Math.random() - 0.5) * 2.2;
      p.vy = 4 + Math.random() * 6;
      p.vz = (Math.random() - 0.5) * 2.2;
      p.life = 1.4 + Math.random() * 1.1;
      p.maxLife = p.life;
      p.size = 0.5 + Math.random() * 0.7;
      p.gravity = -4.2;
      p.drag = 0.7;
      p.twinkle = 1;
      this.pos[idx * 3] = position.x + (Math.random() - 0.5) * 1.6;
      this.pos[idx * 3 + 1] = position.y + Math.random() * 0.6;
      this.pos[idx * 3 + 2] = position.z + (Math.random() - 0.5) * 1.6;
      const c = new THREE.Color(color);
      this.col[idx * 3] = c.r;
      this.col[idx * 3 + 1] = c.g;
      this.col[idx * 3 + 2] = c.b;
      this.size[idx] = p.size;
      this.alpha[idx] = 1;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
    this.geo.attributes.alpha.needsUpdate = true;
  }

  update(dt) {
    let any = false;
    for (let i = 0; i < this.max; i++) {
      const p = this.parts[i];
      if (!p.alive) continue;
      any = true;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        this.alpha[i] = 0;
        continue;
      }
      const damp = Math.exp(-p.drag * dt);
      p.vx *= damp;
      p.vz *= damp;
      p.vy = p.vy * damp + p.gravity * dt;
      this.pos[i * 3] += p.vx * dt;
      this.pos[i * 3 + 1] += p.vy * dt;
      this.pos[i * 3 + 2] += p.vz * dt;
      const t = p.life / p.maxLife;
      let a = Math.min(1, t * 1.8);
      if (p.twinkle > 0) a *= 0.65 + 0.35 * Math.sin(p.life * 22);
      this.alpha[i] = a;
    }
    if (any) {
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.alpha.needsUpdate = true;
    }
  }
}
