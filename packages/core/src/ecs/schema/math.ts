/**
 * 3D vector stored on schema-driven components.
 * Structurally identical to `Transform`'s `Vec3`.
 */
export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Quaternion stored as `{ x, y, z, w }`.
 */
export interface Quat {
    x: number;
    y: number;
    z: number;
    w: number;
}

/** Origin. */
export const ZERO_VEC3: Vec3 = { x: 0, y: 0, z: 0 };

/** Identity rotation. */
export const IDENTITY_QUAT: Quat = { x: 0, y: 0, z: 0, w: 1 };

/**
 * Detached copy of a vector so two entities never share the default object.
 */
export const cloneVec3 = (value: Vec3): Vec3 => ({ x: value.x, y: value.y, z: value.z });

/**
 * Detached copy of a quaternion so two entities never share the default object.
 */
export const cloneQuat = (value: Quat): Quat => ({
    x: value.x,
    y: value.y,
    z: value.z,
    w: value.w
});
