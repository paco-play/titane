import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { worldPointFromRay } from '../world-point';

describe('worldPointFromRay', () => {
  it('returns the first mesh hit', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
    mesh.position.set(0, 1, -4);
    mesh.updateMatrixWorld();
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(0, 1, 4),
      new THREE.Vector3(0, 0, -1)
    );
    const point = worldPointFromRay(raycaster, [mesh]);
    expect(point.z).toBeCloseTo(-3, 4);
    expect(point.y).toBeCloseTo(1, 4);
  });

  it('falls back to the y = 0 plane', () => {
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(2, 4, 2),
      new THREE.Vector3(0, -1, 0)
    );
    expect(worldPointFromRay(raycaster, [])).toEqual({ x: 2, y: 0, z: 2 });
  });
});
