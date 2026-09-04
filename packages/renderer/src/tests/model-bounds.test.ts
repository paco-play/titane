import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { collectModelTrimesh } from '../model-trimesh';
import { localAabbOfRoot } from '../model-bounds';

const unitBoxRoot = (): THREE.Group => {
  const root = new THREE.Group();
  root.add(new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6)));
  root.updateMatrixWorld(true);
  return root;
};

describe('model bounds and trimesh', () => {
  it('computes a local AABB around a box mesh', () => {
    const aabb = localAabbOfRoot(unitBoxRoot());
    expect(aabb).not.toBeNull();
    expect(aabb!.size.x).toBeCloseTo(2, 4);
    expect(aabb!.size.y).toBeCloseTo(4, 4);
    expect(aabb!.size.z).toBeCloseTo(6, 4);
    expect(aabb!.center.y).toBeCloseTo(0, 4);
  });

  it('ignores the root world pose when measuring local bounds', () => {
    const root = unitBoxRoot();
    root.position.set(10, 20, 30);
    root.updateMatrixWorld(true);
    const aabb = localAabbOfRoot(root);
    expect(aabb!.center.x).toBeCloseTo(0, 4);
    expect(aabb!.center.y).toBeCloseTo(0, 4);
    expect(aabb!.center.z).toBeCloseTo(0, 4);
  });

  it('collects a scaled triangle soup', () => {
    const geometry = collectModelTrimesh(unitBoxRoot(), { x: 2, y: 1, z: 1 });
    expect(geometry).not.toBeNull();
    expect(geometry!.indices.length).toBeGreaterThanOrEqual(3);
    let maxX = 0;
    for (let i = 0; i < geometry!.vertices.length; i += 3) {
      maxX = Math.max(maxX, Math.abs(geometry!.vertices[i] ?? 0));
    }
    expect(maxX).toBeCloseTo(2, 4);
  });
});
