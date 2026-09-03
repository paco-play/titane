import type { World } from '../kernel/world';
import { stepPhysicsWorld } from '../../physics/sync';

/**
 * Advances Rapier for every entity with a `RigidBody`.
 * Pose is written back onto `Transform` for dynamic bodies.
 * @param world - The current world state.
 * @param deltaTime - Fixed simulation step, in seconds.
 */
export const rapierPhysicsSystem = (world: World, deltaTime: number): void => {
    stepPhysicsWorld(world, deltaTime);
};
