import type { Entity } from '@titane/core';
import type { Object3D } from 'three';

/**
 * Converts a pointer position in CSS pixels into OpenGL-style NDC.
 * @param clientX Pointer X in viewport coordinates.
 * @param clientY Pointer Y in viewport coordinates.
 * @param rect The canvas bounding rectangle.
 * @returns Normalized device coordinates in `[-1, 1]`.
 */
export const pointerToNdc = (
    clientX: number,
    clientY: number,
    rect: { left: number, top: number, width: number, height: number }
): { x: number, y: number } => ({
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1
});

/**
 * Walks a raycast hit list and returns the first object that maps to an entity.
 *
 * Hits on helper children (gizmo handles, etc.) still resolve if an ancestor
 * carries the mapping, so the caller can pass the raw intersection list.
 *
 * @param hits Ordered raycast intersections, closest first.
 * @param entityOf Looks up the entity stored on an object, if any.
 * @returns The nearest mapped entity, or null when the ray missed everything.
 */
/**
 * Walks a raycast hit list and returns the first object that maps to an entity.
 *
 * Hits on helper children (gizmo handles, etc.) still resolve if an ancestor
 * carries the mapping, so the caller can pass the raw intersection list.
 * Instanced meshes pass `instanceId` so each slot can map to a different entity.
 *
 * @param hits Ordered raycast intersections, closest first.
 * @param entityOf Looks up the entity stored on an object, if any.
 * @returns The nearest mapped entity, or null when the ray missed everything.
 */
export const entityFromHits = (
    hits: ReadonlyArray<{ object: Object3D; instanceId?: number }>,
    entityOf: (object: Object3D, instanceId?: number) => Entity | undefined
): Entity | null => {
    for (const hit of hits) {
        let current: Object3D | null = hit.object;

        while (current) {
            const entityId = entityOf(current, hit.instanceId);
            if (entityId !== undefined) return entityId;
            current = current.parent;
        }
    }

    return null;
};
