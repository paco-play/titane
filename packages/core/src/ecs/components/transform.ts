import type { Entity } from '../types';
import { defineComponent } from '../kernel/registry';
import { mat4Create } from '../../utils/math';
import { createTransformStore } from '../kernel/transform-store';

/**
 * A point or direction in 3D space.
 */
export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Represents the spatial properties of an entity.
 * `position`, `rotation` and `scale` are local to the parent.
 */
export interface Transform {
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
    parent: Entity | null;
    /** Computed by the transform system. Never authored by hand. */
    worldMatrix: Float32Array;
    isDirty: boolean;
}

/**
 * Factory function to create a new Transform data object.
 * @param position Initial position.
 * @param rotation Initial rotation (in radians).
 * @param scale Initial scale.
 * @returns A clean Transform object.
 */
export const createTransform = (
    position: Vec3 = { x: 0, y: 0, z: 0 },
    rotation: Vec3 = { x: 0, y: 0, z: 0 },
    scale: Vec3 = { x: 1, y: 1, z: 1 }
): Transform => ({
    position: { ...position },
    rotation: { ...rotation },
    scale: { ...scale },
    parent: null,
    worldMatrix: mat4Create(),
    isDirty: true
});

/**
 * Rebuilds a Transform coming from JSON.
 * `worldMatrix` is a Float32Array, which JSON cannot represent, so it is
 * reallocated and flagged dirty for the transform system to recompute.
 * @param raw The plain object parsed from a scene file.
 * @returns A live Transform instance.
 */
const reviveTransform = (raw: unknown): Transform => {
    const source = raw as Partial<Transform>;
    const transform = createTransform(source.position, source.rotation, source.scale);
    transform.parent = source.parent ?? null;
    return transform;
};

/**
 * Typed handle for the Transform component.
 */
export const Transform = defineComponent<Transform>(
    'transform',
    createTransform,
    reviveTransform,
    createTransformStore
);
