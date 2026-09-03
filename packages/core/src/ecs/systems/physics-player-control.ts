import type { World } from '../kernel/world';
import type { System } from '../pipeline/system';
import { defineQuery, runQuery } from '../kernel/query';
import { getComponent } from '../kernel/component';
import { Input } from '../components/input';
import { PlayerControlled } from '../components/player-controlled';
import { RigidBody } from '../components/rigid-body';
import { Transform } from '../components/transform';
import { getPhysicsSession } from '../../physics/session';
import { isBodyGrounded } from '../../physics/ground';
import { moveAxesFromInput, PLAYER_JUMP_SPEED, PLAYER_MOVE_SPEED } from './move-axes';

const inputQuery = defineQuery([Input]);
const playerQuery = defineQuery([PlayerControlled, RigidBody, Transform]);

const IDENTITY_ROTATION = { x: 0, y: 0, z: 0, w: 1 };
const ZERO_ANGVEL = { x: 0, y: 0, z: 0 };

/**
 * Drives a Rapier dynamic body from WASD / arrows and Space.
 *
 * Horizontal linear velocity is overwritten each frame. Jump only fires when
 * a downward ray hits the ground. Rotations are locked so a sphere does not roll.
 * Sample gameplay: never registered by the default pipeline.
 *
 * @param speed - Horizontal speed in world units per second.
 * @param jumpSpeed - Upward linvel applied on Space while grounded.
 */
export const createPhysicsPlayerControlSystem = (
    speed = PLAYER_MOVE_SPEED,
    jumpSpeed = PLAYER_JUMP_SPEED
): System =>
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
        const wantsJump = input.justPressed['Space'] === true;

        for (const entityId of runQuery(world, playerQuery)) {
            const rigid = getComponent(world, entityId, RigidBody);
            const transform = getComponent(world, entityId, Transform);
            if (!rigid || rigid.kind !== 'dynamic' || !transform) continue;

            const binding = session.bodies.get(entityId);
            if (!binding) continue;

            binding.body.lockRotations(true, true);
            binding.body.setAngvel(ZERO_ANGVEL, true);
            binding.body.setRotation(IDENTITY_ROTATION, true);

            const current = binding.body.linvel();
            const velocityY = wantsJump && isBodyGrounded(session, binding, transform)
                ? jumpSpeed
                : current.y;

            binding.body.setLinvel({ x: velocityX, y: velocityY, z: velocityZ }, true);
        }
    };
