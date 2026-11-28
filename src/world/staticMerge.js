import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Turn a crowd of small static meshes into a handful of merged meshes.
 *
 * The hollow is dressed with hundreds of little trees, rocks and flowers per
 * island. Each one is its own draw call even though nothing about them moves.
 * Merging every mesh that shares a material into one buffer cuts the calls
 * dramatically without touching the silhouette, the colours or the collision
 * data. Anything animated (canopies, rings, sprites, instanced grass) can be
 * passed in `keep` and is left exactly where it is.
 */

function materialKey(material) {
  const map = material.map ? material.map.uuid : '';
  const color = material.color ? material.color.getHexString() : '';
  const emissive = material.emissive ? material.emissive.getHexString() : '';
  return [
    material.type,
    color,
    emissive,
    material.emissiveIntensity ?? '',
    material.roughness ?? '',
    material.metalness ?? '',
    material.flatShading ? 1 : 0,
    material.transparent ? 1 : 0,
    material.opacity ?? '',
    material.depthWrite ? 1 : 0,
    material.depthTest ? 1 : 0,
    material.side ?? '',
    material.blending ?? '',
    material.vertexColors ? 1 : 0,
    material.alphaTest ?? '',
    map,
  ].join('|');
}

/**
 * @param {THREE.Object3D} root group whose local space the merged geometry is
 *   baked into. The merged meshes become children of `root`.
 * @param {{ keep?: THREE.Object3D[] | Set<THREE.Object3D>, tag?: string }} options
 * @returns {number} how many draw calls the merge produced
 */
export function mergeStatic(root, options = {}) {
  const keep = options.keep instanceof Set ? options.keep : new Set(options.keep ?? []);
  const tag = options.tag ?? 'merged-static';
  root.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();

  const meshes = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return;
    if (Array.isArray(o.material)) return;
    if (!o.geometry?.attributes.position) return;
    if (!o.geometry.attributes.normal || !o.geometry.attributes.uv) return;
    for (let p = o; p && p !== root; p = p.parent) {
      if (keep.has(p)) return;
      if (!p.visible) return;
    }
    meshes.push(o);
  });
  if (meshes.length < 2) return meshes.length;

  const buckets = new Map();
  for (const mesh of meshes) {
    const key = materialKey(mesh.material);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material: mesh.material, geometries: [] };
      buckets.set(key, bucket);
    }
    let geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    for (const name of Object.keys(geo.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') geo.deleteAttribute(name);
    }
    geo.clearGroups();
    const local = new THREE.Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld);
    geo.applyMatrix4(local);
    bucket.geometries.push(geo);
  }

  for (const mesh of meshes) mesh.parent?.remove(mesh);

  let produced = 0;
  for (const bucket of buckets.values()) {
    const geo = bucket.geometries.length === 1
      ? bucket.geometries[0]
      : mergeGeometries(bucket.geometries, false);
    if (!geo) continue;
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    const merged = new THREE.Mesh(geo, bucket.material);
    merged.name = tag;
    merged.matrixAutoUpdate = false;
    merged.updateMatrix();
    root.add(merged);
    produced++;
    if (bucket.geometries.length > 1) for (const g of bucket.geometries) g.dispose();
  }

  // The originals are gone; their GPU buffers can go too. Geometry in these
  // decorated groups is never shared with an animated object.
  for (const mesh of meshes) mesh.geometry.dispose();
  return produced;
}
