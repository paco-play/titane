import type { Vec3 } from '../ecs/components/transform';

/** Quaternion in Rapier's `{ x, y, z, w }` layout. */
export interface Quat {
    x: number;
    y: number;
    z: number;
    w: number;
}

/**
 * Converts Euler XYZ radians into a unit quaternion.
 * Matches Three.js / `mat4FromTRS` XYZ order (X then Y then Z).
 * @param euler - Local rotation matching `Transform.rotation`.
 */
export const eulerXyzToQuat = (euler: Vec3): Quat => {
    const c1 = Math.cos(euler.x * 0.5);
    const c2 = Math.cos(euler.y * 0.5);
    const c3 = Math.cos(euler.z * 0.5);
    const s1 = Math.sin(euler.x * 0.5);
    const s2 = Math.sin(euler.y * 0.5);
    const s3 = Math.sin(euler.z * 0.5);

    return {
        x: s1 * c2 * c3 + c1 * s2 * s3,
        y: c1 * s2 * c3 - s1 * c2 * s3,
        z: c1 * c2 * s3 + s1 * s2 * c3,
        w: c1 * c2 * c3 - s1 * s2 * s3
    };
};

/**
 * Converts a quaternion back to Euler XYZ radians.
 * Extracts from the same column-major matrix layout as `mat4FromTRS`.
 * @param q - Rapier rotation.
 * @param out - Written in place to avoid allocating in the physics loop.
 */
export const quatToEulerXyz = (q: Quat, out: Vec3): void => {
    const x2 = q.x + q.x;
    const y2 = q.y + q.y;
    const z2 = q.z + q.z;
    const xx = q.x * x2;
    const xy = q.x * y2;
    const xz = q.x * z2;
    const yy = q.y * y2;
    const yz = q.y * z2;
    const zz = q.z * z2;
    const wx = q.w * x2;
    const wy = q.w * y2;
    const wz = q.w * z2;

    const m00 = 1 - (yy + zz);
    const m01 = xy - wz;
    const m02 = xz + wy;
    const m12 = yz - wx;
    const m20 = xz - wy;
    const m21 = yz + wx;
    const m22 = 1 - (xx + yy);

    const sy = Math.min(1, Math.max(-1, m02));
    out.y = Math.asin(sy);

    if (Math.abs(sy) < 0.999999) {
        out.x = Math.atan2(-m12, m22);
        out.z = Math.atan2(-m01, m00);
        return;
    }

    out.x = Math.atan2(m21, m20);
    out.z = 0;
};
