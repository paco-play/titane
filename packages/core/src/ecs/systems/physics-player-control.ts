import type { World } from '../kernel/world';
import type { System } from '../pipeline/system';
import { defineQuery, runQuery } from '../kernel/query';
import { getComponent } from '../kernel/component';
import { Input } from '../components/input';
import { PlayerControlled } from '../components/player-controlled';
import { RigidBody } from '../components/rigid-body';
import { Transform } from '../components/transform';
import { getPhysicsSession } from '../../physics/session';
import { moveAxesFromInput, PLAYER_MOVE_SPEED } from './move-axes';

const inputQuery = defineQuery([Input]);
const playerQuery = defineQuery([PlayerControlled, RigidBody, Transform]);

/**
 * Drives a Rapier dynamic body from WASD / arrows.
 *
 * Horizontal linear velocity is overwritten each frame; `linvel.y` is left
 * alone so gravity and jumps (when a game adds them) keep working.
 * Sample gameplay: never registered by the default pipeline.
 *
 * @param speed - Horizontal speed in world units per second.
 */
export const createPhysicsPlayerControlSystem = (speed = PLAYER_MOVE_SPEED): System =>
    (world: World): void => {
        const session = getPhysicsSession(world);
        if (!session) return;

        const inputEntity = runQuery(world, inputQuery)[0];
        if (inputEntity === undefined) return;

        const input = getComponent(world, inputEntity, Input);
        if (!input) return;

        const axes = moveAxesFromInput(input);
        const velocityX = axes.x * speed;
        const velocityZ = axes.z * speed;

        for (const entityId of runQuery(world, playerQuery)) {
            const rigid = getComponent(world, entityId, RigidBody);
            if (!rigid || rigid.kind !== 'dynamic') continue;

            const binding = session.bodies.get(entityId);
            if (!binding) continue;

            const current = binding.body.linvel();
            binding.body.setLinvel({ x: velocityX, y: current.y, z: velocityZ }, true);
        }
    };
