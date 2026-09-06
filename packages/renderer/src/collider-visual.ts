import type { ColliderData, Entity, Vec3 } from '@titane/core';
import type { LocalAabb } from './model-bounds';

/** Rapier rejects zero-sized shapes. Same floor as `collider-desc.ts`. */
const MIN_EXTENT = 0.001;

/** Overlay draw filter. `selected` is the gizmo target. */
export type ColliderOverlayMode = 'selected' | 'all';

export type ColliderVisual = {
    readonly kind: ColliderData['kind'];
    readonly center: Vec3;
    readonly size: Vec3;
    readonly radius: number;
    readonly cylinderHeight: number;
};

const absMax = (a: number, b: number, c = b): number =>
    Math.max(Math.abs(a), Math.abs(b), Math.abs(c));

const scaledCenter = (center: Vec3, scale: Vec3): Vec3 => ({
    x: center.x * scale.x,
    y: center.y * scale.y,
    z: center.z * scale.z
});

const floor = (value: number): number => Math.max(MIN_EXTENT, Math.abs(value));

/**
 * Local collider extents matching Rapier (`collider-desc.ts`).
 * Body pose is unscaled; scale is baked into the shape. Mesh uses the
 * model AABB (or a unit box) instead of the trimesh.
 */
export const colliderVisualFromData = (
    collider: ColliderData,
    scale: Vec3,
    meshAabb: LocalAabb | null = null
): ColliderVisual => {
    const center = scaledCenter(collider.center, scale);

    if (collider.kind === 'sphere') {
        return {
            kind: 'sphere',
            center,
            size: { x: 0, y: 0, z: 0 },
            radius: floor(collider.radius * absMax(scale.x, scale.y, scale.z)),
            cylinderHeight: 0
        };
    }

    if (collider.kind === 'capsule') {
        return {
            kind: 'capsule',
            center,
            size: { x: 0, y: 0, z: 0 },
            radius: floor(collider.radius * absMax(scale.x, scale.z)),
            cylinderHeight: floor(collider.height * scale.y)
        };
    }

    if (collider.kind === 'mesh') {
        const aabb = meshAabb ?? { center: { x: 0, y: 0, z: 0 }, size: { x: 1, y: 1, z: 1 } };
        return {
            kind: 'mesh',
            center: {
                x: center.x + aabb.center.x * scale.x,
                y: center.y + aabb.center.y * scale.y,
                z: center.z + aabb.center.z * scale.z
            },
            size: {
                x: floor(aabb.size.x * scale.x),
                y: floor(aabb.size.y * scale.y),
                z: floor(aabb.size.z * scale.z)
            },
            radius: 0,
            cylinderHeight: 0
        };
    }

    return {
        kind: 'box',
        center,
        size: {
            x: floor(collider.size.x * scale.x),
            y: floor(collider.size.y * scale.y),
            z: floor(collider.size.z * scale.z)
        },
        radius: 0,
        cylinderHeight: 0
    };
};

/** True when this collider should be drawn for the current overlay mode. */
export const shouldDrawCollider = (
    mode: ColliderOverlayMode,
    selected: Entity | null,
    entity: Entity
): boolean => mode === 'all' || entity === selected;
