import type { World } from '../kernel/world';
import { defineQuery, runQuery } from '../kernel/query';
import { getComponent } from '../kernel/component';
import { Transform } from '../components/transform';
import { Velocity } from '../components/velocity';

const movingQuery = defineQuery([Transform, Velocity]);

/**
 * Integrates velocity into position for every moving entity.
 *
 * This is the engine's generic, gameplay-agnostic integrator: it only turns
 * units-per-second into a frame displacement. Deciding what sets the velocity
 * is the game's job.
 *
 * @param world - The current world state to process.
 * @param deltaTime - Time elapsed since the last frame in seconds.
 */
export const integrateVelocitySystem = (world: World, deltaTime: number): void => {
    for (const entityId of runQuery(world, movingQuery)) {
        const velocity = getComponent(world, entityId, Velocity);
        if (!velocity) continue;
        if (velocity.x === 0 && velocity.y === 0 && velocity.z === 0) continue;

        const transform = getComponent(world, entityId, Transform);
        if (!transform) continue;

        transform.position.x += velocity.x * deltaTime;
        transform.position.y += velocity.y * deltaTime;
        transform.position.z += velocity.z * deltaTime;
        transform.isDirty = true;
    }
};
