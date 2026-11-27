import * as THREE from 'three';
import { valueNoise, smoothstep, lerp } from '../engine/utils.js';

/**
 * A round floating island. Its surface is generated from broad, gentle noise
 * and the exact same function places the player's feet, so walking always
 * matches what you can see.
 *
 * Important places (stations, portals, the spawn point and the island centre)
 * get a flat pad of ground blended into the hills, so signs always stand on
 * level ground and stay visible from a child's eye height.
 */
export class Island {
  constructor(zone) {
    this.zone = zone;
    this.radius = zone.radius;
    this.seed = zone.seed;
    this.origin = new THREE.Vector3(zone.origin.x, zone.origin.y, zone.origin.z);
    this.group = new THREE.Group();
    this.group.position.copy(this.origin);
    this.surface = null;
    this.underside = null;

    // Level ground under everything the child needs to reach.
    const spots = [{ x: 0, z: 0, r: 9 }, { x: zone.spawn.x, z: zone.spawn.z, r: 7 }];
    if (zone.kind === 'hub') spots.push({ x: 0, z: 4, r: 10 });
    for (const s of zone.stations) spots.push({ x: s.x, z: s.z, r: 7.5 });
    for (const p of zone.portals) spots.push({ x: p.x, z: p.z, r: 6 });
    this.flats = spots.map((s) => ({ ...s, y: this._rawHeight(s.x, s.z) }));

    this._build(zone.palette);
  }

  _rawHeight(x, z) {
    const R = this.radius;
    const s = this.seed;
    const d = Math.hypot(x, z);

    const broad = (valueNoise(x * 0.013 + s, z * 0.013 + s) - 0.5) * 2.9;
    const mid = (valueNoise(x * 0.038 + s * 2.3, z * 0.038 + s * 2.3) - 0.5) * 0.95;
    const detail = (valueNoise(x * 0.1 + s * 3.7, z * 0.1 + s * 3.7) - 0.5) * 0.2;

    const plateau = smoothstep(R * 0.1, R * 0.62, d);
    let h = (broad + mid) * (0.28 + 0.72 * plateau) + detail * (0.3 + 0.7 * plateau);

    // The rim curves down into the clouds.
    const rim = smoothstep(R * 0.74, R, d);
    h -= rim * rim * 13;
    return h;
  }

  heightAtLocal(x, z) {
    let h = this._rawHeight(x, z);
    for (const f of this.flats) {
      const d = Math.hypot(x - f.x, z - f.z);
      const reach = f.r * 1.75;
      if (d < reach) {
        const t = 1 - smoothstep(f.r * 0.72, reach, d);
        h = lerp(h, f.y, t);
      }
    }
    return h;
  }

  /** World-space ground height for a world XZ position. */
  groundAt(x, z) {
    return this.origin.y + this.heightAtLocal(x - this.origin.x, z - this.origin.z);
  }

  distanceTo(x, z) {
    return Math.hypot(x - this.origin.x, z - this.origin.z);
  }

  isWalkable(x, z) {
    return this.distanceTo(x, z) < this.radius * 0.955;
  }

  _build(palette) {
    const R = this.radius;
    const rings = 34;
    const segments = 108;
    const positions = [];
    const colors = [];
    const indices = [];

    const cGrassA = new THREE.Color(palette.grassA);
    const cGrassB = new THREE.Color(palette.grassB);
    const cGrassC = new THREE.Color(palette.grassC);
    const cEdge = new THREE.Color(palette.edge);
    const tmp = new THREE.Color();

    positions.push(0, this.heightAtLocal(0, 0), 0);
    tmp.copy(cGrassA).lerp(cGrassC, 0.3);
    colors.push(tmp.r, tmp.g, tmp.b);

    for (let r = 1; r <= rings; r++) {
      const t = r / rings;
      const radius = R * Math.pow(t, 0.92);
      for (let s = 0; s < segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        const y = this.heightAtLocal(x, z);
        positions.push(x, y, z);

        const n = valueNoise(x * 0.09 + this.seed, z * 0.09 + this.seed);
        const n2 = valueNoise(x * 0.31 + 9, z * 0.31 + 9);
        tmp.copy(cGrassA).lerp(cGrassB, Math.min(1, Math.max(0, n * 1.25)));
        tmp.lerp(cGrassC, Math.min(0.55, Math.max(0, (n2 - 0.62) * 1.6)));
        const rimMix = smoothstep(R * 0.82, R * 0.97, radius);
        tmp.lerp(cEdge, rimMix * 0.92);
        tmp.multiplyScalar(Math.min(1.06, Math.max(0.72, 0.88 + y * 0.03)));
        colors.push(tmp.r, tmp.g, tmp.b);
      }
    }

    const idx = (r, s) => 1 + (r - 1) * segments + (s % segments);

    for (let s = 0; s < segments; s++) {
      indices.push(0, idx(1, s + 1), idx(1, s));
    }
    for (let r = 1; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const a = idx(r, s);
        const b = idx(r, s + 1);
        const c = idx(r + 1, s);
        const d = idx(r + 1, s + 1);
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.0,
      flatShading: true,
    });
    this.surface = new THREE.Mesh(geo, mat);
    this.group.add(this.surface);

    // Rocky underside so the island reads as floating from every angle.
    const underGeo = new THREE.ConeGeometry(R * 0.99, 30, 40, 3, true);
    underGeo.rotateX(Math.PI);
    const pos = underGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const jitter = valueNoise(x * 0.25 + this.seed, z * 0.25 + this.seed) - 0.5;
      pos.setXYZ(i, x * (1 + jitter * 0.12), y - 12 - jitter * 2, z * (1 + jitter * 0.12));
    }
    underGeo.computeVertexNormals();
    const underMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.edge).lerp(new THREE.Color(0x6a5a9c), 0.45),
      roughness: 1,
      flatShading: true,
    });
    this.underside = new THREE.Mesh(underGeo, underMat);
    this.underside.position.y = -1.6;
    this.group.add(this.underside);

    // A whisper of glowing mist under each island.
    const mistGeo = new THREE.SphereGeometry(R * 0.55, 20, 14);
    const mistMat = new THREE.MeshBasicMaterial({
      color: palette.accent,
      transparent: true,
      opacity: 0.075,
      depthWrite: false,
    });
    this.mist = new THREE.Mesh(mistGeo, mistMat);
    this.mist.position.y = -10;
    this.mist.scale.y = 0.5;
    this.group.add(this.mist);
  }
}
