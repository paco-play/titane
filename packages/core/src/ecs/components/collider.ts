import { defineComponent } from '../kernel/registry';
import type { Vec3 } from './transform';

/**
 * Analytic or mesh collider, independent of `Mesh.primitive`.
 *
 * `box` uses `size` (full extents). `sphere` uses `radius`. `capsule` uses
 * `radius` and `height` (cylindrical length along local Y). `mesh` is a
 * Rapier trimesh supplied at runtime from the renderer; it is not stored
 * in `.titane`.
 */
export const COLLIDER_KINDS = ['box', 'sphere', 'capsule', 'mesh'] as const;

export type ColliderKind = (typeof COLLIDER_KINDS)[number];

export interface ColliderData {
    kind: ColliderKind;
    /** Local offset from the rigid-body origin, before `Transform.scale`. */
    center: Vec3;
    /** Full box dimensions. Ignored for sphere / capsule / mesh. */
    size: Vec3;
    /** Sphere or capsule radius. */
    radius: number;
    /** Capsule cylindrical length along local Y. */
    height: number;
}

const DEFAULT_SIZE: Vec3 = { x: 1, y: 1, z: 1 };
const DEFAULT_CENTER: Vec3 = { x: 0, y: 0, z: 0 };

const cloneVec3 = (value: Vec3): Vec3 => ({ x: value.x, y: value.y, z: value.z });

const asKind = (value: unknown): ColliderKind =>
    value === 'sphere' || value === 'capsule' || value === 'mesh' ? value : 'box';

const asFinite = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asVec3 = (value: unknown, fallback: Vec3): Vec3 => {
    if (typeof value !== 'object' || value === null) return cloneVec3(fallback);
    const record = value as Partial<Vec3>;
    return {
        x: asFinite(record.x, fallback.x),
        y: asFinite(record.y, fallback.y),
        z: asFinite(record.z, fallback.z)
    };
};

/**
 * Factory for a Collider component.
 */
export const createCollider = (kind: ColliderKind = 'box'): ColliderData => ({
    kind,
    center: cloneVec3(DEFAULT_CENTER),
    size: cloneVec3(DEFAULT_SIZE),
    radius: 0.5,
    height: 1
});

const reviveCollider = (raw: unknown): ColliderData => {
    const source = raw as Partial<ColliderData>;
    const created = createCollider(asKind(source.kind));
    created.center = asVec3(source.center, DEFAULT_CENTER);
    created.size = asVec3(source.size, DEFAULT_SIZE);
    created.radius = Math.max(0.001, asFinite(source.radius, 0.5));
    created.height = Math.max(0.001, asFinite(source.height, 1));
    return created;
};

export const Collider = defineComponent<ColliderData>(
    'collider',
    () => createCollider(),
    reviveCollider
);
