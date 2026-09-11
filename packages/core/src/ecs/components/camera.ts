import { defineComponent } from '../kernel/registry';

/** Default vertical field of view, matching `THREE.PerspectiveCamera(75, …)`. */
export const DEFAULT_CAMERA_FOV = 75;

/** Default near clip, matching the Three.js driver. */
export const DEFAULT_CAMERA_NEAR = 0.1;

/** Default far clip, matching the Three.js driver. */
export const DEFAULT_CAMERA_FAR = 1000;

/** Default half-height of an orthographic view, in world units. */
export const DEFAULT_CAMERA_ORTHO_SIZE = 5;

/** Projections Play / game mode can apply. Edit orbit stays perspective. */
export const CAMERA_PROJECTIONS = ['perspective', 'orthographic'] as const;

export type CameraProjection = (typeof CAMERA_PROJECTIONS)[number];

/**
 * Marks an entity as a view into the world. Pose comes from `Transform`.
 * Play / game mode uses the camera whose `current` flag is true.
 */
export interface CameraData {
    /** Perspective or orthographic. Edit orbit ignores this. */
    projection: CameraProjection;
    /** Vertical field of view in degrees. Used when `projection` is perspective. */
    fov: number;
    /** Half the vertical extent in world units. Used when `projection` is orthographic. */
    orthoSize: number;
    /** Near clip plane. Must be > 0. */
    near: number;
    /** Far clip plane. Must be > near. */
    far: number;
    /** When true, Play and game mode look through this camera. */
    current: boolean;
}

const clampFov = (fov: number): number => Math.min(179, Math.max(1, fov));
const clampNear = (near: number): number => Math.max(0.001, near);
const clampOrthoSize = (size: number): number => Math.max(0.001, size);

const reviveProjection = (raw: unknown): CameraProjection =>
    raw === 'orthographic' ? 'orthographic' : 'perspective';

/**
 * Factory for a Camera data object.
 * @param fov - Vertical field of view in degrees.
 * @param near - Near clip plane.
 * @param far - Far clip plane.
 * @param current - Whether Play / game mode uses this camera.
 * @param projection - Perspective or orthographic.
 * @param orthoSize - Half-height of the orthographic view.
 */
export const createCamera = (
    fov = DEFAULT_CAMERA_FOV,
    near = DEFAULT_CAMERA_NEAR,
    far = DEFAULT_CAMERA_FAR,
    current = true,
    projection: CameraProjection = 'perspective',
    orthoSize = DEFAULT_CAMERA_ORTHO_SIZE
): CameraData => {
    const clippedNear = clampNear(near);
    return {
        projection: reviveProjection(projection),
        fov: clampFov(fov),
        orthoSize: clampOrthoSize(orthoSize),
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
        source.current ?? true,
        source.projection,
        source.orthoSize
    );
};

/**
 * Typed handle for the Camera component.
 */
export const Camera = defineComponent<CameraData>('camera', () => createCamera(), reviveCamera);
