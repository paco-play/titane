import * as THREE from 'three';
import type { MeshColliderGeometry } from '@titane/core';

/**
 * Merges every mesh under `root` into one triangle soup in root-local space,
 * then applies `scale` so the Rapier body (which has no scale) matches the visual.
 */
export const collectModelTrimesh = (
    root: THREE.Object3D,
    scale: { x: number; y: number; z: number }
): MeshColliderGeometry | null => {
    root.updateWorldMatrix(true, true);
    const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const localMatrix = new THREE.Matrix4();
    const vertex = new THREE.Vector3();

    const vertices: number[] = [];
    const indices: number[] = [];

    root.traverse(child => {
        if (!(child instanceof THREE.Mesh) || !child.geometry) return;
        const position = child.geometry.getAttribute('position');
        if (!position) return;

        const index = child.geometry.getIndex();
        const vertexOffset = vertices.length / 3;
        localMatrix.copy(child.matrixWorld).premultiply(inverseRoot);

        for (let i = 0; i < position.count; i += 1) {
            vertex.fromBufferAttribute(position, i).applyMatrix4(localMatrix);
            vertices.push(vertex.x * scale.x, vertex.y * scale.y, vertex.z * scale.z);
        }

        if (index) {
            for (let i = 0; i < index.count; i += 1) {
                indices.push(vertexOffset + index.getX(i));
            }
            return;
        }

        for (let i = 0; i < position.count; i += 1) {
            indices.push(vertexOffset + i);
        }
    });

    if (vertices.length < 9 || indices.length < 3) return null;
    return {
        vertices: new Float32Array(vertices),
        indices: new Uint32Array(indices)
    };
};
