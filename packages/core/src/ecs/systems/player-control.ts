import type { World } from '../kernel/world';
import type { System } from '../pipeline/system';
import { defineQuery, runQuery } from '../kernel/query';
import { getComponent } from '../kernel/component';
import { Velocity } from '../components/velocity';
import { Input } from '../components/input';
import { PlayerControlled } from '../components/player-controlled';
import { moveAxesFromInput, PLAYER_MOVE_SPEED } from './move-axes';

const inputQuery = defineQuery([Input]);
const playerQuery = defineQuery([Velocity, PlayerControlled]);

/**
 * Drives the velocity of `PlayerControlled` entities from keyboard input (WASD
 * and arrow keys).
 *
 * This is sample gameplay, not engine behaviour: it ships with the engine as a
 * ready-made system but is never registered by the default pipeline. Register
 * it explicitly with `engine.addSystem(Phase.UPDATE, createPlayerControlSystem())`.
 *
 * Bodies with a `RigidBody` should use {@link createPhysicsPlayerControlSystem}
 * instead: the kinematic integrator skips those entities.
 *
 * @param speed - Movement speed in world units per second.
 * @returns A system driving player velocity from the global input state.
 */
export const createPlayerControlSystem = (speed = PLAYER_MOVE_SPEED): System =>
    (world: World): void => {
        const inputEntities = runQuery(world, inputQuery);
        const inputEntity = inputEntities[0];
        if (inputEntity === undefined) return;

        const input = getComponent(world, inputEntity, Input);
        if (!input) return;

        const axes = moveAxesFromInput(input);
        const velocityX = axes.x * speed;
        const velocityZ = axes.z * speed;

        for (const entityId of runQuery(world, playerQuery)) {
            const velocity = getComponent(world, entityId, Velocity);
            if (!velocity) continue;

            velocity.x = velocityX;
            velocity.z = velocityZ;
        }
    };
