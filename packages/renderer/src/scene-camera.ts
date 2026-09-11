import * as THREE from 'three';
import type { World } from '@titane/core';
import { getComponent, pickCurrentCamera, Transform, Camera } from '@titane/core';

const MATRIX = new THREE.Matrix4();
const POSITION = new THREE.Vector3();
const QUATERNION = new THREE.Quaternion();
const SCALE = new THREE.Vector3();

/** Pair of Three.js cameras Play / game mode can copy the ECS view onto. */
export interface SceneViewCameras {
    perspective: THREE.PerspectiveCamera;
    orthographic: THREE.OrthographicCamera;
}

/**
 * Writes `orthoSize` (half-height, world units) onto an orthographic camera.
 */
export const applyOrthographicSize = (
    camera: THREE.OrthographicCamera,
    orthoSize: number,
    aspect: number
): void => {
    const height = Math.max(0.001, orthoSize);
    const width = height * Math.max(0.001, aspect);
    camera.left = -width;
    camera.right = width;
    camera.top = height;
    camera.bottom = -height;
    camera.updateProjectionMatrix();
};

const applyWorldPose = (camera: THREE.Camera, worldMatrix: Float32Array): void => {
    MATRIX.fromArray(worldMatrix);
    MATRIX.decompose(POSITION, QUATERNION, SCALE);
    camera.position.copy(POSITION);
    camera.quaternion.copy(QUATERNION);
};

/**
 * Copies the current scene camera's world pose and projection onto the matching
 * Three.js camera. Edit orbit is not this path.
 * @returns The camera to render with, or `null` when none is current.
 */
export const applySceneCamera = (
    world: World,
    cameras: SceneViewCameras,
    aspect: number
): THREE.Camera | null => {
    const entityId = pickCurrentCamera(world);
    if (entityId === null) return null;

    const transform = getComponent(world, entityId, Transform);
    const data = getComponent(world, entityId, Camera);
    if (!transform || !data) return null;

    if (data.projection === 'orthographic') {
        applyWorldPose(cameras.orthographic, transform.worldMatrix);
        cameras.orthographic.near = data.near;
        cameras.orthographic.far = data.far;
        applyOrthographicSize(cameras.orthographic, data.orthoSize, aspect);
        return cameras.orthographic;
    }

    applyWorldPose(cameras.perspective, transform.worldMatrix);
    cameras.perspective.fov = data.fov;
    cameras.perspective.near = data.near;
    cameras.perspective.far = data.far;
    cameras.perspective.aspect = Math.max(0.001, aspect);
    cameras.perspective.updateProjectionMatrix();
    return cameras.perspective;
};
