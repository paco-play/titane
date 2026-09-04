import * as THREE from 'three';
import type { World } from '@titane/core';
import { getComponent, pickCurrentCamera, Transform, Camera } from '@titane/core';

const MATRIX = new THREE.Matrix4();
const POSITION = new THREE.Vector3();
const QUATERNION = new THREE.Quaternion();
const SCALE = new THREE.Vector3();

/**
 * Copies the current scene camera's world pose and projection onto `camera`.
 * @returns True when a current camera was applied.
 */
export const applySceneCamera = (
    world: World,
    camera: THREE.PerspectiveCamera
): boolean => {
    const entityId = pickCurrentCamera(world);
    if (entityId === null) return false;

    const transform = getComponent(world, entityId, Transform);
    const data = getComponent(world, entityId, Camera);
    if (!transform || !data) return false;

    MATRIX.fromArray(transform.worldMatrix);
    MATRIX.decompose(POSITION, QUATERNION, SCALE);
    camera.position.copy(POSITION);
    camera.quaternion.copy(QUATERNION);
    camera.fov = data.fov;
    camera.near = data.near;
    camera.far = data.far;
    camera.updateProjectionMatrix();
    return true;
};
