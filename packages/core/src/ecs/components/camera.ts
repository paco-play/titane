import { defineComponent } from '../kernel/registry';

/** Default vertical field of view, matching `THREE.PerspectiveCamera(75, …)`. */
export const DEFAULT_CAMERA_FOV = 75;

/** Default near clip, matching the Three.js driver. */
export const DEFAULT_CAMERA_NEAR = 0.1;

/** Default far clip, matching the Three.js driver. */
export const DEFAULT_CAMERA_FAR = 1000;

/**
 * Marks an entity as a view into the world. Pose comes from `Transform`.
 * Play / game mode uses the camera whose `current` flag is true.
 */
export interface CameraData {
    /** Vertical field of view in degrees. */
    fov: number;
    /** Near clip plane. Must be > 0. */
    near: number;
    /** Far clip plane. Must be > near. */
    far: number;
    /** When true, Play and game mode look through this camera. */
    current: boolean;
}

const clampFov = (fov: number): number => Math.min(179, Math.max(1, fov));
const clampNear = (near: number): number => Math.max(0.001, near);

/**
 * Factory for a Camera data object.
 * @param fov - Vertical field of view in degrees.
 * @param near - Near clip plane.
 * @param far - Far clip plane.
 * @param current - Whether Play / game mode uses this camera.
 */
export const createCamera = (
    fov = DEFAULT_CAMERA_FOV,
    near = DEFAULT_CAMERA_NEAR,
    far = DEFAULT_CAMERA_FAR,
    current = true
): CameraData => {
    const clippedNear = clampNear(near);
    return {
        fov: clampFov(fov),
        near: clippedNear,
        far: Math.max(clippedNear + 0.001, far),
        current
    };
};

/**
 * Fills fields that older scenes omitted.
 */
const reviveCamera = (raw: unknown): CameraData => {
    const source = raw as Partial<CameraData>;
    return createCamera(
        source.fov,
        source.near,
        source.far,
        source.current ?? true
    );
};

/**
 * Typed handle for the Camera component.
 */
export const Camera = defineComponent<CameraData>('camera', () => createCamera(), reviveCamera);
