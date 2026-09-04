import * as THREE from 'three';

/**
 * First mesh hit along the ray, or the `y = groundY` plane if the ray
 * misses every target. A ray parallel to the plane yields the origin.
 */
export const worldPointFromRay = (
    raycaster: THREE.Raycaster,
    targets: readonly THREE.Object3D[],
    groundY = 0
): { x: number; y: number; z: number } => {
    const hits = raycaster.intersectObjects(targets as THREE.Object3D[], true);
    const firstHit = hits[0];
    if (firstHit) {
        return { x: firstHit.point.x, y: firstHit.point.y, z: firstHit.point.z };
    }

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
    const point = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, point)) {
        return { x: point.x, y: point.y, z: point.z };
    }

    return { x: 0, y: groundY, z: 0 };
};
