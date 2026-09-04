import type { PerspectiveCamera, Vector3 } from 'three';

/**
 * Editor orbit pose captured when Play starts, restored when Play stops.
 */
export interface EditorCameraPose {
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
    fov: number;
    near: number;
    far: number;
    target: { x: number; y: number; z: number };
}

/**
 * Snapshot of the orbit camera so Play can steal it without losing the edit view.
 */
export const captureEditorCamera = (
    camera: PerspectiveCamera,
    orbitTarget: Vector3
): EditorCameraPose => ({
    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    quaternion: {
        x: camera.quaternion.x,
        y: camera.quaternion.y,
        z: camera.quaternion.z,
        w: camera.quaternion.w
    },
    fov: camera.fov,
    near: camera.near,
    far: camera.far,
    target: { x: orbitTarget.x, y: orbitTarget.y, z: orbitTarget.z }
});

/**
 * Writes a captured editor pose back onto the perspective camera and orbit target.
 */
export const restoreEditorCamera = (
    camera: PerspectiveCamera,
    orbitTarget: Vector3,
    pose: EditorCameraPose
): void => {
    camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    camera.quaternion.set(pose.quaternion.x, pose.quaternion.y, pose.quaternion.z, pose.quaternion.w);
    camera.fov = pose.fov;
    camera.near = pose.near;
    camera.far = pose.far;
    camera.updateProjectionMatrix();
    orbitTarget.set(pose.target.x, pose.target.y, pose.target.z);
};
