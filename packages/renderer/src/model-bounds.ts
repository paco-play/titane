import * as THREE from 'three';

export interface LocalAabb {
    readonly center: { x: number; y: number; z: number };
    readonly size: { x: number; y: number; z: number };
}

/**
 * Axis-aligned bounds of every mesh under `root`, in the root's local space.
 * The root's own world matrix (ECS pose) is factored out.
 */
export const localAabbOfRoot = (root: THREE.Object3D): LocalAabb | null => {
    root.updateWorldMatrix(true, true);
    const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const box = new THREE.Box3();
    const meshBox = new THREE.Box3();

    root.traverse(child => {
        if (!(child instanceof THREE.Mesh) || !child.geometry) return;
        const geometry = child.geometry;
        if (!geometry.boundingBox) geometry.computeBoundingBox();
        if (!geometry.boundingBox) return;
        meshBox.copy(geometry.boundingBox);
        meshBox.applyMatrix4(child.matrixWorld);
        meshBox.applyMatrix4(inverseRoot);
        box.union(meshBox);
    });

    if (box.isEmpty()) return null;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return {
        center: { x: center.x, y: center.y, z: center.z },
        size: { x: size.x, y: size.y, z: size.z }
    };
};

/** Unit box used when the entity is a primitive mesh, not a glTF. */
export const UNIT_LOCAL_AABB: LocalAabb = {
    center: { x: 0, y: 0, z: 0 },
    size: { x: 1, y: 1, z: 1 }
};
