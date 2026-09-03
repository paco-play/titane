import { describe, it, expect } from 'vitest';
import * as THREE from 'three';

describe('mesh matrix sync', () => {
    it('does not move a mesh when only position changes and matrixAutoUpdate is false', () => {
        const mesh = new THREE.Mesh();
        mesh.matrixAutoUpdate = false;
        mesh.position.set(2, 0, 0);

        // This is the gizmo bug: TransformControls writes position, but the
        // renderer draws `matrix`, which stays at the origin until composed.
        expect(mesh.matrix.elements[12]).toBe(0);

        mesh.updateMatrix();
        expect(mesh.matrix.elements[12]).toBe(2);
    });

    it('draws only the assigned geometry after a primitive swap', () => {
        const box: THREE.BufferGeometry = new THREE.BoxGeometry(1, 1, 1);
        const plane: THREE.BufferGeometry = new THREE.PlaneGeometry(1, 1);
        const mesh = new THREE.Mesh(box);

        mesh.geometry = plane;

        expect(mesh.geometry).toBe(plane);
        expect(mesh.geometry).not.toBe(box);
        expect(mesh.geometry).toBeInstanceOf(THREE.PlaneGeometry);
    });
});
