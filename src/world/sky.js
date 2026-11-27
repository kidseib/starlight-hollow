import * as THREE from 'three';
import { makeSprite, glowTexture } from './textures.js';

const VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform vec3 sunColor;
  uniform vec3 sunDir;
  uniform float time;
  varying vec3 vWorld;

  void main() {
    vec3 dir = normalize(vWorld);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(bottomColor, topColor, pow(h, 0.95));
    float glow = pow(max(dot(dir, normalize(sunDir)), 0.0), 26.0);
    col += sunColor * glow * 0.55;
    // faint horizon shimmer
    float band = sin(dir.y * 26.0 + time * 0.15) * 0.012;
    col += band * sunColor;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class SkySystem {
  constructor(scene) {
    this.scene = scene;
    this.uniforms = {
      topColor: { value: new THREE.Color(0x5cc4ff) },
      bottomColor: { value: new THREE.Color(0xe9fbff) },
      sunColor: { value: new THREE.Color(0xfff7dd) },
      sunDir: { value: new THREE.Vector3(0.4, 0.72, 0.35) },
      time: { value: 0 },
    };

    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(520, 32, 20),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      })
    );
    this.dome.frustumCulled = false;
    scene.add(this.dome);

    this.hemi = new THREE.HemisphereLight(0xcbe9ff, 0x6f8a5a, 1.15);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff7dd, 2.1);
    this.sun.position.set(60, 90, 40);
    scene.add(this.sun);

    this.fill = new THREE.DirectionalLight(0xbcd8ff, 0.5);
    this.fill.position.set(-50, 30, -60);
    scene.add(this.fill);

    scene.fog = new THREE.Fog(0xd6f4ff, 45, 235);

    this.clouds = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const cloud = makeSprite(0xffffff, 60 + Math.random() * 70, 0.16);
      const a = Math.random() * Math.PI * 2;
      const dist = 150 + Math.random() * 180;
      cloud.position.set(Math.cos(a) * dist, 25 + Math.random() * 70, Math.sin(a) * dist);
      cloud.scale.y *= 0.55;
      this.clouds.add(cloud);
    }
    scene.add(this.clouds);

    this.motes = null;
    this.motePhase = 0;
  }

  applyZone(zone) {
    const p = zone.palette;
    this.uniforms.topColor.value.setHex(p.skyTop);
    this.uniforms.bottomColor.value.setHex(p.skyBottom);
    this.uniforms.sunColor.value.setHex(p.sun);
    this.hemi.color.setHex(p.ambient);
    this.hemi.groundColor.setHex(p.grassB);
    this.hemi.intensity = 1.28;
    this.sun.color.setHex(p.sun);
    this.sun.intensity = 2.25;
    this.fill.color.setHex(p.accent);
    this.scene.fog.color.setHex(p.fog);
    this.scene.fog.near = 52;
    this.scene.fog.far = 250;
    this.scene.background = new THREE.Color(p.skyBottom);

    this._buildMotes(zone);
  }

  _buildMotes(zone) {
    if (this.motes) {
      this.scene.remove(this.motes);
      this.motes.geometry.dispose();
      this.motes.material.dispose();
      this.motes = null;
    }
    const count = 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const base = new THREE.Color(zone.palette.accent);
    const alt = new THREE.Color(0xffffff);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * zone.radius * 1.15;
      positions[i * 3] = zone.origin.x + Math.cos(a) * r;
      positions[i * 3 + 1] = zone.origin.y + Math.random() * 14 - 2;
      positions[i * 3 + 2] = zone.origin.z + Math.sin(a) * r;
      const c = base.clone().lerp(alt, Math.random() * 0.7);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: glowTexture(),
    });
    this.motes = new THREE.Points(geo, mat);
    this.motes.frustumCulled = false;
    this.scene.add(this.motes);
  }

  update(dt, camera, time) {
    this.uniforms.time.value = time;
    this.dome.position.copy(camera.position);
    if (this.motes) {
      this.motes.rotation.y = time * 0.012;
      this.motes.position.y = Math.sin(time * 0.25) * 0.5;
    }
    this.clouds.rotation.y = time * 0.004;
    this.clouds.position.set(camera.position.x, 0, camera.position.z);
  }
}
