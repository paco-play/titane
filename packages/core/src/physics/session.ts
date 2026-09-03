import RAPIER from './load-rapier';
import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import type { RigidBodyKind } from '../ecs/components/rigid-body';
import type { PrimitiveType } from '../ecs/components/mesh';

const GRAVITY = { x: 0, y: -9.81, z: 0 };

/**
 * One Rapier body plus the ECS facts used to decide when to rebuild it.
 */
export interface BodyBinding {
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    kind: RigidBodyKind;
    primitive: PrimitiveType;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
}

/**
 * Rapier world paired with the ECS world that owns it.
 */
export interface PhysicsSession {
    physics: RAPIER.World;
    bodies: Map<Entity, BodyBinding>;
}

const sessions = new WeakMap<World, PhysicsSession>();

let ready: Promise<void> | undefined;
let initialized = false;

/**
 * Loads the Rapier WASM module. Safe to call more than once.
 * Must resolve before any physics step.
 */
export const initPhysics = (): Promise<void> => {
    if (!ready) {
        ready = RAPIER.init().then(() => {
            initialized = true;
        });
    }
    return ready;
};

/**
 * Whether {@link initPhysics} has finished.
 */
export const isPhysicsReady = (): boolean => initialized;

/**
 * Returns the Rapier session for an ECS world, creating it on first use.
 * @returns The session, or null when WASM is not ready yet.
 */
export const getPhysicsSession = (world: World): PhysicsSession | null => {
    if (!initialized) return null;

    const existing = sessions.get(world);
    if (existing) return existing;

    const session: PhysicsSession = {
        physics: new RAPIER.World(GRAVITY),
        bodies: new Map()
    };
    sessions.set(world, session);
    return session;
};

/**
 * Drops the Rapier world so the next step rebuilds bodies from ECS poses.
 * Call after a snapshot restore or scene load.
 */
export const resetPhysicsSession = (world: World): void => {
    const session = sessions.get(world);
    if (!session) return;
    session.physics.free();
    sessions.delete(world);
};
