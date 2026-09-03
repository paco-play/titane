import RAPIER from './load-rapier';
import type { PrimitiveType } from '../ecs/components/mesh';
import type { Vec3 } from '../ecs/components/transform';

/** Half-thickness of a plane collider, along local Z (Three.js planes are XY). */
const PLANE_HALF_THICKNESS = 0.005;

/** Rapier rejects zero-sized shapes. */
const MIN_EXTENT = 0.001;

const half = (value: number): number => Math.max(MIN_EXTENT, Math.abs(value) * 0.5);

/**
 * Builds a Rapier collider that matches a unit-boxed primitive at the given scale.
 * @param primitive - ECS mesh primitive.
 * @param scale - Local `Transform.scale`.
 */
export const colliderDescFromPrimitive = (
    primitive: PrimitiveType,
    scale: Vec3
): RAPIER.ColliderDesc => {
    switch (primitive) {
        case 'sphere':
            return RAPIER.ColliderDesc.ball(
                Math.max(MIN_EXTENT, 0.5 * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)))
            );
        case 'plane':
            return RAPIER.ColliderDesc.cuboid(half(scale.x), half(scale.y), PLANE_HALF_THICKNESS);
        case 'box':
            return RAPIER.ColliderDesc.cuboid(half(scale.x), half(scale.y), half(scale.z));
    }
    // TypeScript exhaustiveness; unreachable at runtime.
};

/**
 * Applies the sensor flag to a finished `ColliderDesc`.
 * Rapier records intersection events only when at least one of the two
 * shapes has `isSensor = true` and both enable `ActiveEvents.COLLISION_EVENTS`.
 */
export const asSensorDesc = (desc: RAPIER.ColliderDesc): RAPIER.ColliderDesc =>
    desc
        .setSensor(true)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

/**
 * Updates an existing collider when only scale changed.
 * @param collider - Live Rapier collider.
 * @param primitive - Shape currently baked into the collider.
 * @param scale - Local `Transform.scale`.
 */
export const applyColliderScale = (
    collider: RAPIER.Collider,
    primitive: PrimitiveType,
    scale: Vec3
): void => {
    switch (primitive) {
        case 'sphere':
            collider.setRadius(
                Math.max(MIN_EXTENT, 0.5 * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)))
            );
            return;
        case 'plane':
            collider.setHalfExtents({ x: half(scale.x), y: half(scale.y), z: PLANE_HALF_THICKNESS });
            return;
        case 'box':
            collider.setHalfExtents({ x: half(scale.x), y: half(scale.y), z: half(scale.z) });
    }
};
