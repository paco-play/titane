import RAPIER from './load-rapier';
import type { Transform } from '../ecs/components/transform';
import type { PrimitiveType } from '../ecs/components/mesh';
import type { BodyBinding, PhysicsSession } from './session';

/** Extra ray length past the collider so contact jitter still counts as ground. */
const GROUND_SKIN = 0.15;

const MIN_EXTENT = 0.001;

/**
 * Rapier ESM types this as `toi`; the CJS WASM build used in Vitest
 * exposes `timeOfImpact` instead.
 */
interface RayHit {
    toi?: number;
    timeOfImpact?: number;
}

const toiOf = (hit: RayHit): number | undefined => hit.toi ?? hit.timeOfImpact;

/**
 * Vertical half-extent of a unit-boxed primitive, matching the Rapier collider.
 */
export const colliderHalfHeight = (primitive: PrimitiveType, scale: Transform['scale']): number => {
    switch (primitive) {
        case 'sphere':
            return Math.max(
                MIN_EXTENT,
                0.5 * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z))
            );
        case 'plane':
            return Math.max(MIN_EXTENT, Math.abs(scale.y) * 0.5);
        case 'box':
            return Math.max(MIN_EXTENT, Math.abs(scale.y) * 0.5);
    }
};

/**
 * True when a downward ray from the body hits another collider within
 * the body's half-height plus a small skin.
 */
export const isBodyGrounded = (
    session: PhysicsSession,
    binding: BodyBinding,
    transform: Transform
): boolean => {
    const halfHeight = colliderHalfHeight(binding.primitive, transform.scale);
    const origin = binding.body.translation();
    const ray = new RAPIER.Ray(
        { x: origin.x, y: origin.y, z: origin.z },
        { x: 0, y: -1, z: 0 }
    );
    const maxToi = halfHeight + GROUND_SKIN;
    const hit = session.physics.castRay(
        ray,
        maxToi,
        true,
        undefined,
        undefined,
        undefined,
        binding.body
    );
    const toi = hit === null ? undefined : toiOf(hit);
    return toi !== undefined && toi <= maxToi;
};
