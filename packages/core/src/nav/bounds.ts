import type { ColliderData } from '../ecs/components/collider';
import type { Vec3 } from '../ecs/components/transform';

/** Axis-aligned world bounds of an authored collider. */
export interface WorldAabb {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
}

const MIN_EXTENT = 0.001;

const floor = (value: number): number => Math.max(MIN_EXTENT, Math.abs(value));

const absMax = (a: number, b: number, c = b): number =>
    Math.max(Math.abs(a), Math.abs(b), Math.abs(c));

type LocalBox = { cx: number; cy: number; cz: number; hx: number; hy: number; hz: number };

/**
 * Local collider box matching Rapier (scale baked into the shape, pose unscaled).
 */
export const colliderLocalBox = (collider: ColliderData, scale: Vec3): LocalBox => {
    const cx = collider.center.x * scale.x;
    const cy = collider.center.y * scale.y;
    const cz = collider.center.z * scale.z;

    if (collider.kind === 'sphere') {
        const r = floor(collider.radius * absMax(scale.x, scale.y, scale.z));
        return { cx, cy, cz, hx: r, hy: r, hz: r };
    }

    if (collider.kind === 'capsule') {
        const r = floor(collider.radius * absMax(scale.x, scale.z));
        const hh = floor(collider.height * scale.y) * 0.5 + r;
        return { cx, cy, cz, hx: r, hy: hh, hz: r };
    }

    const hx = floor(collider.size.x * scale.x) * 0.5;
    const hy = floor(collider.size.y * scale.y) * 0.5;
    const hz = floor(collider.size.z * scale.z) * 0.5;
    return { cx, cy, cz, hx, hy, hz };
};

/**
 * Applies rotation + translation from a TRS world matrix, ignoring scale
 * (scale already lives in the local box).
 */
export const transformBodyPoint = (
    matrix: ArrayLike<number>,
    x: number,
    y: number,
    z: number
): Vec3 => {
    const sx = Math.hypot(matrix[0], matrix[1], matrix[2]) || 1;
    const sy = Math.hypot(matrix[4], matrix[5], matrix[6]) || 1;
    const sz = Math.hypot(matrix[8], matrix[9], matrix[10]) || 1;
    return {
        x: (matrix[0] / sx) * x + (matrix[4] / sy) * y + (matrix[8] / sz) * z + matrix[12],
        y: (matrix[1] / sx) * x + (matrix[5] / sy) * y + (matrix[9] / sz) * z + matrix[13],
        z: (matrix[2] / sx) * x + (matrix[6] / sy) * y + (matrix[10] / sz) * z + matrix[14]
    };
};

/**
 * World AABB of a collider using the entity's computed world matrix.
 */
export const colliderWorldAabb = (
    collider: ColliderData,
    scale: Vec3,
    worldMatrix: ArrayLike<number>
): WorldAabb => {
    const box = colliderLocalBox(collider, scale);
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
            for (const sz of [-1, 1]) {
                const p = transformBodyPoint(
                    worldMatrix,
                    box.cx + sx * box.hx,
                    box.cy + sy * box.hy,
                    box.cz + sz * box.hz
                );
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.z < minZ) minZ = p.z;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
                if (p.z > maxZ) maxZ = p.z;
            }
        }
    }

    return { minX, minY, minZ, maxX, maxY, maxZ };
};

export const aabbContainsXz = (
    aabb: WorldAabb,
    x: number,
    z: number,
    pad: number
): boolean =>
    x >= aabb.minX - pad
    && x <= aabb.maxX + pad
    && z >= aabb.minZ - pad
    && z <= aabb.maxZ + pad;
